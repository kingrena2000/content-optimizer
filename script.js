// script.js (最终调试版本)

// 日志：检查文件是否被加载
console.log('[Content Optimizer] DEBUG: script.js 文件本身已被浏览器加载。');

try {
    // 模仿 'st-input-helper' 的导入路径
    const { extension_settings, getContext } = await import('../../../extensions.js');
    const { saveSettingsDebounced } = await import('../../../../script.js');

    // 日志：检查模块是否成功导入
    console.log('[Content Optimizer] DEBUG: SillyTavern 模块导入成功。');

    const extensionName = "content-optimizer";

    const defaultSettings = {
        optimizer_enabled: false,
        optimizer_endpoint: 'https://api.openai.com/v1/chat/completions',
        optimizer_apiKey: '',
        optimizer_prompt: '请将以下文本进行润色和优化，使其表达更流畅、更生动。原始文本：\n\n{{text}}',
    };

    async function onResponse(response) {
        // ... (这部分逻辑暂时不重要，先省略日志)
    }

    async function callOptimizationAPI(textToOptimize) {
        // ... (这部分逻辑暂时不重要，先省略日志)
    }

    // 模仿 'st-input-helper' 的初始化方式
    jQuery(async () => {
        try {
            console.log('[Content Optimizer] DEBUG: jQuery(async) 初始化块开始执行。');

            // 1. 加载设置
            extension_settings[extensionName] = extension_settings[extensionName] || {};
            Object.assign(defaultSettings, extension_settings[extensionName]);
            extension_settings[extensionName] = defaultSettings;
            console.log('[Content Optimizer] DEBUG: 1. 设置对象已准备好。', extension_settings[extensionName]);

            // 2. 加载HTML
            // 为了调试，我们先用一个最简单的硬编码路径
            const settingsHtmlPath = `/extensions/${extensionName}/settings.html`;
            console.log(`[Content Optimizer] DEBUG: 2. 准备从路径 ${settingsHtmlPath} 获取HTML...`);
            
            const settingsHtml = await $.get(settingsHtmlPath);
            console.log('[Content Optimizer] DEBUG: 2a. 获取HTML成功！内容长度:', settingsHtml.length);

            // 将HTML附加到页面
            $("#extensions_settings").append(settingsHtml);
            console.log('[Content Optimizer] DEBUG: 2b. HTML已附加到 #extensions_settings。');

            // 3. 手动填充UI
            const settings = extension_settings[extensionName];
            $('#optimizer_enabled').prop('checked', settings.optimizer_enabled);
            $('#optimizer_endpoint').val(settings.optimizer_endpoint);
            $('#optimizer_apiKey').val(settings.optimizer_apiKey);
            $('#optimizer_prompt').val(settings.optimizer_prompt);
            console.log('[Content Optimizer] DEBUG: 3. UI元素已手动填充数据。');

            // 4. 绑定UI事件
            $('#optimizer_enabled').on('change', function() {
                extension_settings[extensionName].optimizer_enabled = $(this).is(':checked');
                saveSettingsDebounced();
            });
            // ... (其他绑定)
            console.log('[Content Optimizer] DEBUG: 4. UI事件已绑定。');

            // 5. 注册事件钩子
            $(document).on('response', (event, response) => {
                // 这个在实际响应时才会触发，暂时不加日志
            });
            console.log('[Content Optimizer] DEBUG: 5. \'response\' 事件钩子已注册。');

            console.log('[Content Optimizer] ★★★ DEBUG: 插件初始化流程看起来已成功完成！ ★★★');

        } catch (initError) {
            console.error('[Content Optimizer] XXX DEBUG: 在jQuery初始化块内部发生致命错误！XXX', initError);
        }
    });

} catch (importError) {
    console.error('[Content Optimizer] XXX DEBUG: 模块导入失败！这是最顶层的错误，可能是路径问题。XXX', importError);
}
