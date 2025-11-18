// script.js (硬编码HTML最终版)

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
    
    // 【【【【【 终极解决方案：将HTML硬编码为字符串 】】】】】
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
                <label for="optimizer_endpoint">优化API端点 (Endpoint)</label>
                <input id="optimizer_endpoint" class="text_pole" type="text">
                <label for="optimizer_apiKey">优化API密钥 (API Key)</label>
                <input id="optimizer_apiKey" class="text_pole" type="password">
                <small>如果API需要，请填写。例如 "Bearer sk-..."</small>
                <label for="optimizer_prompt">优化提示词 (Optimization Prompt)</label>
                <textarea id="optimizer_prompt" class="text_pole" rows="6"></textarea>
                <small>
                    这是发送给优化API的指令。你可以使用占位符 \`{{text}}\` 来代表需要优化的内容。<br>
                    例如：请将以下段落进行润色，使其更具文学性，同时保持原意。段落：{{text}}
                </small>
            </div>
        </div>
    </div>
    `;

    // onResponse 和 callOptimizationAPI 函数保持原样 (此处省略)
    // ...

    jQuery(async () => {
        try {
            console.log('[Content Optimizer] DEBUG: jQuery 初始化块开始。');

            extension_settings[extensionName] = extension_settings[extensionName] || {};
            Object.assign(defaultSettings, extension_settings[extensionName]);
            extension_settings[extensionName] = defaultSettings;
            
            // 直接使用我们硬编码的HTML字符串，不再有任何网络请求
            $("#extensions_settings").append(settingsHtmlString);
            console.log('[Content Optimizer] DEBUG: 硬编码的HTML已附加。');

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
