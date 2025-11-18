// script.js (最终路径修正版)

console.log('[Content Optimizer] DEBUG: script.js 文件加载。');

try {
    const { extension_settings } = await import('../../../extensions.js');
    const { saveSettingsDebounced } = await import('../../../../script.js');
    console.log('[Content Optimizer] DEBUG: 模块导入成功。');

    const extensionName = "content-optimizer";

    const defaultSettings = {
        optimizer_enabled: false,
        optimizer_endpoint: 'https://api.openai.com/v1/chat/completions',
        optimizer_apiKey: '',
        optimizer_prompt: '请将以下文本进行润色和优化，使其表达更流畅、更生动。原始文本：\n\n{{text}}',
    };

    // onResponse 和 callOptimizationAPI 函数保持原样 (此处省略)
    // ...

    jQuery(async () => {
        try {
            console.log('[Content Optimizer] DEBUG: jQuery 初始化块开始。');

            extension_settings[extensionName] = extension_settings[extensionName] || {};
            Object.assign(defaultSettings, extension_settings[extensionName]);
            extension_settings[extensionName] = defaultSettings;
            
            // 【【【【【 关键修正 】】】】】
            // 我们不再拼接服务器的URL，而是直接使用相对于当前脚本的路径。
            // 这是最可靠的方式，因为它不依赖服务器的路由配置。
            const settingsHtmlPath = 'settings.html';
            console.log(`[Content Optimizer] DEBUG: 准备从相对路径 '${settingsHtmlPath}' 获取HTML...`);
            
            const settingsHtml = await $.get(settingsHtmlPath);
            console.log('[Content Optimizer] DEBUG: 获取HTML成功！');
            
            $("#extensions_settings").append(settingsHtml);
            console.log('[Content Optimizer] DEBUG: HTML已附加。');

            const settings = extension_settings[extensionName];
            $('#optimizer_enabled').prop('checked', settings.optimizer_enabled);
            $('#optimizer_endpoint').val(settings.optimizer_endpoint);
            $('#optimizer_apiKey').val(settings.optimizer_apiKey);
            $('#optimizer_prompt').val(settings.optimizer_prompt);
            console.log('[Content Optimizer] DEBUG: UI已填充数据。');

            $('#optimizer_enabled').on('change', function() {
                extension_settings[extensionName].optimizer_enabled = $(this).is(':checked');
                saveSettingsDebounced();
            });
            $('#optimizer_endpoint').on('input', function() {
                extension_settings[extensionName].optimizer_endpoint = $(this).val();
                saveSettingsDebounced();
            });
            $('#optimizer_apiKey').on('input', function() {
                extension_settings[extensionName].optimizer_prompt = $(this).val();
                saveSettingsDebounced();
            });
            console.log('[Content Optimizer] DEBUG: UI事件已绑定。');

            $(document).on('response', (event, response) => {
                // onResponse logic here
            });
            console.log('[Content Optimizer] DEBUG: response钩子已注册。');

            console.log('[Content Optimizer] ★★★ 初始化流程成功完成！★★★');

        } catch (initError) {
            console.error('[Content Optimizer] XXX 在jQuery初始化块内部发生错误！XXX', initError);
        }
    });

} catch (importError) {
    console.error('[Content Optimizer] XXX 模块导入失败！XXX', importError);
}
