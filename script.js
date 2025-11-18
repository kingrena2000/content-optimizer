// script.js (最终修正版, 模仿 'st-input-helper')

// 模仿 'st-input-helper' 的导入路径
import { extension_settings, getContext } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const extensionName = "content-optimizer"; // 必须和 manifest.json 的 "name" 字段一致

const defaultSettings = {
    optimizer_enabled: false,
    optimizer_endpoint: 'https://api.openai.com/v1/chat/completions',
    optimizer_apiKey: '',
    optimizer_prompt: '请将以下文本进行润色和优化，使其表达更流畅、更生动。原始文本：\n\n{{text}}',
};

// onResponse 钩子，它需要能被 jQuery 外部访问，所以我们把它放在顶层
async function onResponse(response) {
    const settings = extension_settings[extensionName];

    if (!settings.optimizer_enabled || !response.text) {
        return; // 新版事件钩子不返回任何东西，直接修改传入的对象
    }

    const contentRegex = /<content>([\s\S]*?)<\/content>/;
    const match = response.text.match(contentRegex);

    if (!match) {
        return;
    }
    
    console.log("[Content Optimizer] 拦截到响应，准备优化。");

    const originalContent = match[1];
    const originalBlock = match[0];

    const optimizedContent = await callOptimizationAPI(originalContent);
    
    response.text = response.text.replace(originalBlock, optimizedContent);
}


async function callOptimizationAPI(textToOptimize) {
    const settings = extension_settings[extensionName];
    const endpoint = settings.optimizer_endpoint;
    const apiKey = settings.optimizer_apiKey;
    const promptTemplate = settings.optimizer_prompt;

    if (!endpoint || !apiKey) {
        console.warn("[Content Optimizer] API endpoint或API key未配置。");
        return textToOptimize;
    }

    const fullPrompt = promptTemplate.replace('{{text}}', textToOptimize);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "你是一个文本优化助手。" },
                    { role: "user", content: fullPrompt }
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`API请求失败，状态码: ${response.status}`);
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


// 模仿 'st-input-helper' 的初始化方式
jQuery(async () => {
    // 1. 加载设置
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    Object.assign(defaultSettings, extension_settings[extensionName]);
    extension_settings[extensionName] = defaultSettings;

    // 2. 将设置HTML加载到扩展面板中
    // 'st-input-helper' 使用 #extensions_settings2, 但标准是 #extensions_settings
    // 我们坚持使用标准容器
    const settingsHtml = await $.get(`/extensions/${extensionName}/${extension_settings[extensionName].settings_html_path}`);
    $("#extensions_settings").append(settingsHtml);

    // 3. 手动将设置值填充到UI元素中
    const settings = extension_settings[extensionName];
    $('#optimizer_enabled').prop('checked', settings.optimizer_enabled);
    $('#optimizer_endpoint').val(settings.optimizer_endpoint);
    $('#optimizer_apiKey').val(settings.optimizer_apiKey);
    $('#optimizer_prompt').val(settings.optimizer_prompt);

    // 4. 绑定UI事件
    $('#optimizer_enabled').on('change', function() {
        extension_settings[extensionName].optimizer_enabled = $(this).is(':checked');
        saveSettingsDebounced();
    });
    $('#optimizer_endpoint').on('input', function() {
        extension_settings[extensionName].optimizer_endpoint = $(this).val();
        saveSettingsDebounced();
    });
    $('#optimizer_apiKey').on('input', function() {
        extension_settings[extensionName].optimizer_apiKey = $(this).val();
        saveSettingsDebounced();
    });
    $('#optimizer_prompt').on('input', function() {
        extension_settings[extensionName].optimizer_prompt = $(this).val();
        saveSettingsDebounced();
    });

    // 5. 注册事件钩子
    // 这是在 'main.js' (SillyTavern核心) 中处理的事件
    // 注意: 新版SillyTavern的response事件参数变了，且不再需要返回值
    $(document).on('response', (event, response) => onResponse(response));

    console.log("[Content Optimizer] 插件已加载并初始化。");
});
