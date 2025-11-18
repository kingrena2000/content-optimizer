// script.js (最终功能完备版)

console.log('[Content Optimizer] DEBUG: script.js 文件加载。');

try {
    const { extension_settings } = await import('../../../extensions.js');
    const { saveSettingsDebounced } = await import('../../../../script.js');
    console.log('[Content Optimizer] DEBUG: 模块导入成功。');

    const extensionName = "content-optimizer";

    // 【新】完备的默认设置
    const defaultSettings = {
        optimizer_enabled: false,
        optimizer_baseUrl: 'https://api.openai.com',
        optimizer_apiKey: '',
        optimizer_model: 'gpt-3.5-turbo', // 新增：模型名称
        optimizer_prompt: '你是一个专业的小说润色助手。请将以下文本进行深度润色和优化，要求在保持原意和情节的基础上，增强语言的文学性和表现力，使用更生动、丰富的词汇和句式，并修复潜在的语法问题。\n\n原始文本：\n{{text}}',
        optimizer_startTag: '<content>',
        optimizer_endTag: '</content>',
        optimizer_addMarker: true, // 新增：是否添加标记的开关
    };
    
    // 【新】完备的硬编码HTML
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
                <h4>API 设置</h4>
                <label for="optimizer_baseUrl">API基础URL (Base URL)</label>
                <input id="optimizer_baseUrl" class="text_pole" type="text" placeholder="例如: https://api.openai.com">
                <small>脚本会自动拼接 <code>/v1/chat/completions</code></small>

                <label for="optimizer_apiKey">API密钥 (API Key)</label>
                <input id="optimizer_apiKey" class="text_pole" type="password">
                
                <label for="optimizer_model">模型名称 (Model)</label>
                <input id="optimizer_model" class="text_pole" type="text" placeholder="例如: gpt-4, gpt-3.5-turbo">
                
                <hr>
                
                <h4>提取与标记</h4>
                <label>正文提取标签</label>
                <div class="inline-group" style="gap: 10px;">
                    <input id="optimizer_startTag" class="text_pole" type="text" style="flex-grow: 1;">
                    <span>...正文...</span>
                    <input id="optimizer_endTag" class="text_pole" type="text" style="flex-grow: 1;">
                </div>
                <div class="inline-group">
                    <label for="optimizer_addMarker">在优化后添加标记 [优化完成]</label>
                    <input id="optimizer_addMarker" type="checkbox">
                </div>

                <hr>

                <h4>优化指令</h4>
                <label for="optimizer_prompt">优化提示词 (Prompt)</label>
                <textarea id="optimizer_prompt" class="text_pole" rows="8"></textarea>
                <small>必须包含占位符 <code>{{text}}</code> 来代表需要优化的内容。</small>
            </div>
        </div>
    </div>
    `;

    // 核心功能：调用优化API (已更新)
    async function callOptimizationAPI(textToOptimize) {
        const settings = extension_settings[extensionName];
        let baseUrl = settings.optimizer_baseUrl;
        const apiKey = settings.optimizer_apiKey;
        const model = settings.optimizer_model; // 读取模型名称
        const promptTemplate = settings.optimizer_prompt;

        if (!baseUrl || !apiKey || !model) {
            console.warn("[Content Optimizer] API基础URL、API key或模型名称未配置。");
            return textToOptimize;
        }

        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }
        
        const endpoint = `${baseUrl}/v1/chat/completions`;
        const fullPrompt = promptTemplate.replace('{{text}}', textToOptimize);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': apiKey },
                body: JSON.stringify({
                    model: model, // 使用用户配置的模型
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
            return textToOptimize; // 出错时返回原始文本
        }
    }

    // 核心功能：onResponse钩子 (已更新)
    async function onResponse(response) {
        const settings = extension_settings[extensionName];

        if (!settings.optimizer_enabled || !response.text) {
            return;
        }
        
        // ... (提取逻辑保持不变)
        const startTag = settings.optimizer_startTag;
        const endTag = settings.optimizer_endTag;
        if (!startTag || !endTag) return;
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const contentRegex = new RegExp(`${escapeRegex(startTag)}([\\s\\S]*?)${escapeRegex(endTag)}`);
        const match = response.text.match(contentRegex);
        if (!match) return;
        
        const originalContent = match[1];
        const originalBlock = match[0];
        const optimizedContent = await callOptimizationAPI(originalContent);
        
        if (optimizedContent.trim() !== originalContent.trim()) {
            let finalContent = optimizedContent;
            
            // 根据设置决定是否添加标记
            if (settings.optimizer_addMarker) {
                finalContent += "\n[优化完成]";
            }
            
            response.text = response.text.replace(originalBlock, finalContent);
        }
    }

    // 初始化块 (jQuery)
    jQuery(async () => {
        try {
            console.log('[Content Optimizer] DEBUG: jQuery 初始化块开始。');

            extension_settings[extensionName] = extension_settings[extensionName] || {};
            extension_settings[extensionName] = Object.assign({}, defaultSettings, extension_settings[extensionName]);
            
            $("#extensions_settings").append(settingsHtmlString);
            console.log('[Content Optimizer] DEBUG: 硬编码的HTML已附加。');

            // 为所有设置项填充数据
            const settings = extension_settings[extensionName];
            $('#optimizer_enabled').prop('checked', settings.optimizer_enabled);
            $('#optimizer_baseUrl').val(settings.optimizer_baseUrl);
            $('#optimizer_apiKey').val(settings.optimizer_apiKey);
            $('#optimizer_model').val(settings.optimizer_model); // 填充模型
            $('#optimizer_prompt').val(settings.optimizer_prompt);
            $('#optimizer_startTag').val(settings.optimizer_startTag);
            $('#optimizer_endTag').val(settings.optimizer_endTag);
            $('#optimizer_addMarker').prop('checked', settings.optimizer_addMarker); // 填充标记开关

            // 统一事件绑定
            $('.content-optimizer-settings').on('change input', 'input, textarea', function() {
                const id = $(this).attr('id');
                const value = $(this).is(':checkbox') ? $(this).is(':checked') : $(this).val();
                extension_settings[extensionName][id] = value;
                saveSettingsDebounced();
            });

            $(document).on('response', (event, response) => onResponse(response));
            console.log('[Content Optimizer] ★★★ 初始化流程成功完成！★★★');

        } catch (initError) {
            console.error('[Content Optimizer] XXX 在jQuery初始化块内部发生错误！XXX', initError);
        }
    });

} catch (importError) {
    console.error('[Content Optimizer] XXX 模块导入失败！XXX', importError);
}
