// script.js (功能增强最终版)

console.log('[Content Optimizer] DEBUG: script.js 文件加载。');

try {
    const { extension_settings } = await import('../../../extensions.js');
    const { saveSettingsDebounced } = await import('../../../../script.js');
    console.log('[Content Optimizer] DEBUG: 模块导入成功。');

    const extensionName = "content-optimizer";

    // 【新】增强的默认设置
    const defaultSettings = {
        optimizer_enabled: false,
        optimizer_baseUrl: 'https://api.openai.com', // 1. 用户只填基础URL
        optimizer_apiKey: '',
        optimizer_prompt: '请将以下文本进行深度润色和优化。要求：\n1. 保持原始核心意思和情节不变。\n2. 增强语言的文学性和表现力，使用更生动、更丰富的词汇和句式。\n3. 修复任何潜在的语法错误或不流畅的表达。\n4. 确保优化后的文本自然、连贯，符合高质量小说的语境。\n\n原始文本：\n\n{{text}}', // 2. 高质量的默认提示词
        optimizer_startTag: '<content>', // 3. 可配置的开始标签
        optimizer_endTag: '</content>', // 3. 可配置的结束标签
    };
    
    // 【新】增强的硬编码HTML
    const settingsHtmlString = `
    <div class="content-optimizer-settings extension_settings" data-extension="content-optimizer">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>内容优化插件 (Content Optimizer)</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="inline-group">
                    <label for="optimizer_enabled">启用插件</label>
                    <input id="optimizer_enabled" type="checkbox">
                </div>
                <hr>
                <label for="optimizer_baseUrl">优化API基础URL (Base URL)</label>
                <input id="optimizer_baseUrl" class="text_pole" type="text" placeholder="例如: https://api.openai.com">
                <small>只需填写到域名，例如 <code>https://api.openai.com</code>，脚本会自动在其后拼接 <code>/v1/chat/completions</code></small>

                <label for="optimizer_apiKey">优化API密钥 (API Key)</label>
                <input id="optimizer_apiKey" class="text_pole" type="password">
                
                <hr>
                
                <label>正文提取标签</label>
                <div class="inline-group" style="gap: 10px;">
                    <input id="optimizer_startTag" class="text_pole" type="text" style="flex-grow: 1;">
                    <span>...正文...</span>
                    <input id="optimizer_endTag" class="text_pole" type="text" style="flex-grow: 1;">
                </div>
                <small>用于从AI原始回复中提取需要优化的正文部分。</small>

                <hr>

                <label for="optimizer_prompt">优化提示词 (Optimization Prompt)</label>
                <textarea id="optimizer_prompt" class="text_pole" rows="8"></textarea>
                <small>
                    这是发送给优化API的指令。必须包含占位符 <code>{{text}}</code> 来代表需要优化的内容。
                </small>
            </div>
        </div>
    </div>
    `;

    // 核心功能：调用优化API (已更新)
    async function callOptimizationAPI(textToOptimize) {
        const settings = extension_settings[extensionName];
        let baseUrl = settings.optimizer_baseUrl;
        const apiKey = settings.optimizer_apiKey;
        const promptTemplate = settings.optimizer_prompt;

        if (!baseUrl || !apiKey) {
            console.warn("[Content Optimizer] API基础URL或API key未配置。");
            return textToOptimize;
        }

        // 移除末尾的斜杠，以防用户多填
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }
        
        // 自动拼接路径
        const endpoint = `${baseUrl}/v1/chat/completions`;
        console.log(`[Content Optimizer] 构造的最终API端点: ${endpoint}`);

        const fullPrompt = promptTemplate.replace('{{text}}', textToOptimize);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': apiKey },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo", // 或者你希望使用的模型
                    messages: [{ role: "user", content: fullPrompt }],
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API请求失败，状态码: ${response.status}, 响应: ${errorBody}`);
            }

            const data = await response.json();
            const optimizedText = data.choices[0].message.content;

            console.log("[Content Optimizer] 内容优化成功。");
            return optimizedText;

        } catch (error) {
            console.error("[Content Optimizer] 调用优化API时出错:", error);
            return textToOptimize;
        }
    }

    // 核心功能：onResponse钩子 (已更新)
    async function onResponse(response) {
        const settings = extension_settings[extensionName];

        if (!settings.optimizer_enabled || !response.text) {
            return;
        }

        const startTag = settings.optimizer_startTag;
        const endTag = settings.optimizer_endTag;
        
        if (!startTag || !endTag) {
            console.warn("[Content Optimizer] 开始或结束标签未配置。");
            return;
        }
        
        // 使用动态标签构建正则表达式
        // 注意：需要对标签中的特殊字符进行转义，以防它们被误解为正则语法
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const contentRegex = new RegExp(`${escapeRegex(startTag)}([\\s\\S]*?)${escapeRegex(endTag)}`);
        
        const match = response.text.match(contentRegex);

        if (!match) {
            // 如果找不到匹配的标签，则静默返回，不做任何操作
            return;
        }
        
        console.log("[Content Optimizer] 拦截到响应，准备优化。");

        const originalContent = match[1];
        const originalBlock = match[0];

        const optimizedContent = await callOptimizationAPI(originalContent);
        response.text = response.text.replace(originalBlock, optimizedContent);
    }

    jQuery(async () => {
        try {
            console.log('[Content Optimizer] DEBUG: jQuery 初始化块开始。');

            extension_settings[extensionName] = extension_settings[extensionName] || {};
            // 使用 Object.assign 来安全地合并默认值，避免覆盖用户已有的设置
            extension_settings[extensionName] = Object.assign({}, defaultSettings, extension_settings[extensionName]);
            
            $("#extensions_settings").append(settingsHtmlString);
            console.log('[Content Optimizer] DEBUG: 硬编码的HTML已附加。');

            // 【新】为所有新设置项填充数据和绑定事件
            const settings = extension_settings[extensionName];
            $('#optimizer_enabled').prop('checked', settings.optimizer_enabled);
            $('#optimizer_baseUrl').val(settings.optimizer_baseUrl);
            $('#optimizer_apiKey').val(settings.optimizer_apiKey);
            $('#optimizer_prompt').val(settings.optimizer_prompt);
            $('#optimizer_startTag').val(settings.optimizer_startTag);
            $('#optimizer_endTag').val(settings.optimizer_endTag);
            console.log('[Content Optimizer] DEBUG: UI已填充数据。');

            // 统一处理所有输入框的事件绑定
            $('.content-optimizer-settings').on('change input', 'input, textarea', function() {
                const id = $(this).attr('id');
                const value = $(this).is(':checkbox') ? $(this).is(':checked') : $(this).val();
                extension_settings[extensionName][id] = value;
                saveSettingsDebounced();
            });
            console.log('[Content Optimizer] DEBUG: UI事件已绑定。');

            $(document).on('response', (event, response) => onResponse(response));
            console.log('[Content Optimizer] DEBUG: response钩子已注册。');

            console.log('[Content Optimizer] ★★★ 初始化流程成功完成！★★★');

        } catch (initError) {
            console.error('[Content Optimizer] XXX 在jQuery初始化块内部发生错误！XXX', initError);
        }
    });

} catch (importError) {
    console.error('[Content Optimizer] XXX 模块导入失败！XXX', importError);
}
