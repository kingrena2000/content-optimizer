// script.js

// 导入SillyTavern的API模块
import { SillyTavern, api, extension_settings, getContext, saveSettingsDebounced } from '../../../script.js';

// 插件名称，需要和文件夹名一致
const extensionName = "content-optimizer";

// 默认设置
const defaultSettings = {
    optimizer_enabled: false,
    optimizer_endpoint: 'https://api.openai.com/v1/chat/completions', // 默认使用OpenAI格式
    optimizer_apiKey: '',
    optimizer_prompt: '请将以下文本进行润色和优化，使其表达更流畅、更生动。原始文本：\n\n{{text}}',
};

// 加载设置，如果为空则使用默认值
extension_settings[extensionName] = extension_settings[extensionName] || {};
Object.assign(defaultSettings, extension_settings[extensionName]);
extension_settings[extensionName] = defaultSettings;

/**
 * 调用优化API的辅助函数
 * @param {string} textToOptimize - 从<content>标签中提取的文本
 * @returns {Promise<string>} - 返回优化后的文本
 */
async function callOptimizationAPI(textToOptimize) {
    const settings = extension_settings[extensionName];
    const endpoint = settings.optimizer_endpoint;
    const apiKey = settings.optimizer_apiKey;
    const promptTemplate = settings.optimizer_prompt;

    if (!endpoint || !apiKey) {
        console.warn("[Content Optimizer] API endpoint或API key未配置。");
        return textToOptimize; // 如果未配置，直接返回原文
    }

    const fullPrompt = promptTemplate.replace('{{text}}', textToOptimize);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey, // 假设是Bearer Token
            },
            body: JSON.stringify({
                // 这个body结构需要根据你的第二个API进行调整
                // 以下是类似OpenAI API的示例
                model: "gpt-3.5-turbo", // 或者你的模型
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
        
        // 根据你的API返回格式解析结果
        // 假设结果在 data.choices[0].message.content
        const optimizedText = data.choices[0].message.content;

        console.log("[Content Optimizer] 内容优化成功。");
        return optimizedText;

    } catch (error) {
        console.error("[Content Optimizer] 调用优化API时出错:", error);
        return textToOptimize; // 出错时返回原始文本，避免流程中断
    }
}


// onResponse钩子，SillyTavern的核心处理函数
// `async` 关键字是必须的，因为我们要等待API调用
async function onResponse(author, text) {
    const settings = extension_settings[extensionName];

    // 检查插件是否启用
    if (!settings.optimizer_enabled) {
        return { text };
    }

    // 使用正则表达式查找 <content>...</content>
    const contentRegex = /<content>([\s\S]*?)<\/content>/;
    const match = text.match(contentRegex);

    // 如果没有找到匹配的标签，直接返回原始文本
    if (!match) {
        return { text };
    }
    
    console.log("[Content Optimizer] 拦截到响应，准备优化。");

    const originalContent = match[1]; // match[1] 是括号内捕获的内容
    const originalBlock = match[0];   // match[0] 是完整的 <content>...</content> 块

    // 调用我们的优化API
    const optimizedContent = await callOptimizationAPI(originalContent);

    // 用优化后的内容替换原始的内容块
    const newText = text.replace(originalBlock, optimizedContent);

    // 返回修改后的文本对象
    // SillyTavern期望一个对象 { text: "..." }
    return { text: newText };
}

// 绑定UI事件和加载设置
jQuery(async () => {
    // 将设置HTML加载到扩展面板中
    $('#extensions_settings').append(
        `<div class="content-optimizer-settings" data-extension="${extensionName}">${await $.get(`/extensions/${extensionName}/settings.html`)}</div>`
    );

    // 绑定设置项的change事件
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
    
    // 注册onResponse钩子
    SillyTavern.extension.events.on('response', onResponse);
});
