// script.js (再次修改版)

import { SillyTavern, api, extension_settings, getContext, saveSettingsDebounced } from '../../script.js';

const extensionName = "content-optimizer";

const defaultSettings = {
    optimizer_enabled: false,
    optimizer_endpoint: 'https://api.openai.com/v1/chat/completions',
    optimizer_apiKey: '',
    optimizer_prompt: '请将以下文本进行润色和优化，使其表达更流畅、更生动。原始文本：\n\n{{text}}',
};

async function setup() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    Object.assign(defaultSettings, extension_settings[extensionName]);
    extension_settings[extensionName] = defaultSettings;

    const settingsHtml = await $.get(`/extensions/${extensionName}/settings.html`);
    $("#extensions_settings").append(settingsHtml);

    // 【关键修改】 在HTML插入后，手动将设置值填充到UI元素中
    const settings = extension_settings[extensionName];
    $('#optimizer_enabled').prop('checked', settings.optimizer_enabled);
    $('#optimizer_endpoint').val(settings.optimizer_endpoint);
    $('#optimizer_apiKey').val(settings.optimizer_apiKey);
    $('#optimizer_prompt').val(settings.optimizer_prompt);

    // 绑定UI事件 (这部分逻辑不变)
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
        extension_s_settings[extensionName].optimizer_prompt = $(this).val();
        saveSettingsDebounced();
    });
}

// ... onResponse 和 callOptimizationAPI 函数保持不变 ...
// (为了简洁，这里省略，请使用上一版本中的代码)

async function callOptimizationAPI(textToOptimize) {
    // (此处代码不变)
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

async function onResponse(response) {
    // (此处代码不变)
    const settings = extension_settings[extensionName];

    if (!settings.optimizer_enabled || !response.text) {
        return response;
    }

    const contentRegex = /<content>([\s\S]*?)<\/content>/;
    const match = response.text.match(contentRegex);

    if (!match) {
        return response;
    }
    
    console.log("[Content Optimizer] 拦截到响应，准备优化。");

    const originalContent = match[1];
    const originalBlock = match[0];

    const optimizedContent = await callOptimizationAPI(originalContent);
    
    response.text = response.text.replace(originalBlock, optimizedContent);

    return response;
}

SillyTavern.extensionapi.registerExtension({
    name: extensionName,
    onResponse: onResponse,
    setup: setup,
});

