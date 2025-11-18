// script.js (最终结构重写 + 超级调试版)

try {
    // 【新】使用SillyTavern的官方API，导入路径也使用官方推荐的
    const { SillyTavern, extension_settings, saveSettingsDebounced } = await import('../../script.js');

    console.log('[Content Optimizer] DEBUG: 核心模块导入成功。');

    const extensionName = "content-optimizer";

    // 默认设置
    const defaultSettings = {
        optimizer_enabled: false,
        optimizer_baseUrl: 'https://api.openai.com',
        optimizer_apiKey: '',
        optimizer_model: 'gpt-3.5-turbo',
        optimizer_prompt: '你是一个专业的小说润色助手。请将以下文本进行深度润色和优化，要求在保持原意和情节的基础上，增强语言的文学性和表现力，使用更生动、丰富的词汇和句式，并修复潜在的语法问题。\n\n原始文本：\n{{text}}',
        optimizer_startTag: '<content>',
        optimizer_endTag: '</content>',
        optimizer_addMarker: true,
    };
    
    // 硬编码HTML
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

    // 【新】UI和设置的初始化函数
    async function setup() {
        console.log('[Content Optimizer] DEBUG: setup() 函数被SillyTavern调用。');

        extension_settings[extensionName] = extension_settings[extensionName] || {};
        extension_settings[extensionName] = Object.assign({}, defaultSettings, extension_settings[extensionName]);
        
        $("#extensions_settings").append(settingsHtmlString);

        const settings = extension_settings[extensionName];
        $('#optimizer_enabled').prop('checked', settings.optimizer_enabled);
        $('#optimizer_baseUrl').val(settings.optimizer_baseUrl);
        $('#optimizer_apiKey').val(settings.optimizer_apiKey);
        $('#optimizer_model').val(settings.optimizer_model);
        $('#optimizer_prompt').val(settings.optimizer_prompt);
        $('#optimizer_startTag').val(settings.optimizer_startTag);
        $('#optimizer_endTag').val(settings.optimizer_endTag);
        $('#optimizer_addMarker').prop('checked', settings.optimizer_addMarker);

        $('.content-optimizer-settings').on('change input', 'input, textarea', function() {
            const id = $(this).attr('id');
            const value = $(this).is(':checkbox') ? $(this).is(':checked') : $(this).val();
            extension_settings[extensionName][id] = value;
            saveSettingsDebounced();
        });
        
        console.log('[Content Optimizer] ★★★ UI和设置初始化完成！★★★');
    }

    // 调用外部API的函数 (保持不变)
    async function callOptimizationAPI(textToOptimize) {
        // ... (此处代码省略，与上一版完全相同)
        const settings = extension_settings[extensionName];
        let baseUrl = settings.optimizer_baseUrl;
        const apiKey = settings.optimizer_apiKey;
        const model = settings.optimizer_model;
        const promptTemplate = settings.optimizer_prompt;
        if (!baseUrl || !apiKey || !model) { return textToOptimize; }
        if (baseUrl.endsWith('/')) { baseUrl = baseUrl.slice(0, -1); }
        const endpoint = `${baseUrl}/v1/chat/completions`;
        const fullPrompt = promptTemplate.replace('{{text}}', textToOptimize);
        try {
            const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': apiKey }, body: JSON.stringify({ model: model, messages: [{ role: "user", content: fullPrompt }], temperature: 0.7, }), });
            if (!response.ok) { const errorBody = await response.text(); throw new Error(`API请求失败，状态码: ${response.status}, 响应: ${errorBody}`); }
            const data = await response.json();
            const optimizedText = data.choices[0].message.content;
            console.log("[Content Optimizer] 外部API调用成功，收到优化后文本。");
            return optimizedText;
        } catch (error) { console.error("[Content Optimizer] 调用优化API时出错:", error); return textToOptimize; }
    }

    // “超级调试”版的 onResponse 函数 (保持不变)
    async function onResponse(response) {
        // ... (此处代码省略，与上一版完全相同，包含所有诊断日志)
        console.groupCollapsed(`--- 内容优化插件诊断 @ ${new Date().toLocaleTimeString()} ---`);
        try {
            const settings = extension_settings[extensionName];
            if (!settings.optimizer_enabled) { console.log("诊断结果: 插件未启用。函数提前退出。"); return; }
            console.log("✅ 诊断点 1: 插件已启用。");
            if (!response.text) { console.log("诊断结果: AI的回复文本为空。函数提前退出。"); return; }
            console.log("✅ 诊断点 2: AI回复文本存在。"); console.log("--- 完整AI回复 ---"); console.log(response.text); console.log("--------------------");
            const startTag = settings.optimizer_startTag; const endTag = settings.optimizer_endTag;
            if (!startTag || !endTag) { console.log("诊断结果: 正文提取的开始或结束标签未在设置中填写。函数提前退出。"); return; }
            console.log(`✅ 诊断点 3: 标签已配置。开始标签: "${startTag}", 结束标签: "${endTag}"`);
            const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const contentRegex = new RegExp(`${escapeRegex(startTag)}([\\s\\S]*?)${escapeRegex(endTag)}`);
            console.log("构建的正则表达式:", contentRegex);
            const match = response.text.match(contentRegex);
            if (!match) { console.log("诊断结果: 在AI回复中没有找到与标签匹配的内容。请检查AI的回复格式是否正确。函数提前退出。"); return; }
            console.log("✅ 诊断点 4: 成功匹配到内容块！", match);
            const originalContent = match[1].trim();
            if (!originalContent) { console.log("诊断结果: 标签之间内容为空。函数提前退出，避免无效API调用。"); return; }
            console.log("✅ 诊断点 5: 成功提取到非空内容:", originalContent);
            console.log("★★★ 所有诊断通过！即将调用API进行优化... ★★★");
            const optimizedContent = await callOptimizationAPI(originalContent); const trimmedOptimized = optimizedContent.trim();
            if (trimmedOptimized && trimmedOptimized !== originalContent) {
                let finalContent = trimmedOptimized;
                if (settings.optimizer_addMarker) { finalContent = `[优化完成]\n${trimmedOptimized}`; }
                const newBlock = `${startTag}${finalContent}${endTag}`;
                response.text = response.text.replace(match[0], newBlock);
                console.log("🎉 优化和替换成功！");
            } else { console.log("信息: 优化后的内容与原始文本相同或为空，未进行文本替换。"); }
        } finally { console.groupEnd(); }
    }

    // 【【【 核心：使用官方API注册插件 】】】
    SillyTavern.extensionapi.registerExtension({
        name: extensionName,
        onResponse: onResponse,
        setup: setup,
    });

    console.log(`[Content Optimizer] 插件 '${extensionName}' 已通过官方API成功注册。`);

} catch (error) {
    console.error('[Content Optimizer] XXX 插件加载失败，这是最顶层的错误！ XXX', error);
}
