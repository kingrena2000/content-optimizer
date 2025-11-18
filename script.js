// script.js (现代化版本)

// 导入SillyTavern的API模块
// 注意：路径现在是 '../../script.js'，这是SillyTavern插件加载器推荐的相对路径
import { SillyTavern, api, extension_settings, getContext, saveSettingsDebounced } from '../../script.js';

// 插件名称，需要和文件夹名一致
const extensionName = "content-optimizer";

// 默认设置
const defaultSettings = {
    optimizer_enabled: false,
    optimizer_endpoint: 'https://api.openai.com/v1/chat/completions', // 默认使用OpenAI格式
    optimizer_apiKey: '',
    optimizer_prompt: '请将以下文本进行润色和优化，使其表达更流畅、更生动。原始文本：\n\n{{text}}',
};

// 【重要】设置加载和UI绑定的函数
async function setup() {
    // 确保设置对象存在
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    // 将默认设置与保存的设置合并，这样可以平滑地添加新设置项
    Object.assign(defaultSettings, extension_settings[extensionName]);
    extension_settings[extensionName] = defaultSettings;

    // 将设置面板的HTML加载到指定的DOM元素中
    const settingsHtml = await $.get(`/extensions/${extensionName}/settings.html`);
    $("#extensions_settings").append(settingsHtml);

    // 绑定UI事件
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
}

// 核心功能：调用优化API (这部分代码无需改动)
async function callOptimizationAPI(textToOptimize) {
    const settings = extension_settings[extensionName];
    // ... (此处省略与原版完全相同的代码)
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

// 核心功能：onResponse钩子 (这部分代码无需改动)
async function onResponse(response) {
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
    
    // 【重要】现代SillyTavern的onResponse钩子返回的是一个完整的response对象
    // 我们需要修改这个对象的 .text 属性
    response.text = response.text.replace(originalBlock, optimizedContent);

    return response;
}

// 【关键】使用SillyTavern的官方API注册插件
SillyTavern.extensionapi.registerExtension({
    name: extensionName,
    // onResponse钩子现在在这里注册
    onResponse: onResponse,
    // setup函数会在SillyTavern准备好后被调用，用于加载UI和设置
    setup: setup,
});
