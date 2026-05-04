import { AIAgent } from './ai-agents';
import { AIModelConfig } from './ai-models';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAIResponseWithModel(
  userMessage: string,
  agent: AIAgent,
  model: AIModelConfig,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const systemPrompt = agent.systemPrompt;

  switch (model.id) {
    case 'openai':
      return await callOpenAI(systemPrompt, userMessage, agent, conversationHistory);
    case 'anthropic':
      return await callAnthropic(systemPrompt, userMessage, agent, conversationHistory);
    case 'google':
      return await callGoogle(systemPrompt, userMessage, agent, conversationHistory);
    case 'coze':
      return await callCoze(systemPrompt, userMessage, agent, conversationHistory);
    default:
      return generateFallbackResponse(userMessage, agent);
  }
}

async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  agent: AIAgent,
  history: ChatMessage[]
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI API key not configured, using fallback response');
    return generateFallbackResponse(userMessage, agent);
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.filter(m => m.role !== 'system'),
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 4096,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);
      return generateFallbackResponse(userMessage, agent);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || generateFallbackResponse(userMessage, agent);
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    return generateFallbackResponse(userMessage, agent);
  }
}

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  agent: AIAgent,
  history: ChatMessage[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn('Anthropic API key not configured, using fallback response');
    return generateFallbackResponse(userMessage, agent);
  }

  try {
    const messages = history
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        system: systemPrompt,
        messages: [...messages, { role: 'user', content: userMessage }],
        max_tokens: 4096,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', response.status, errorData);
      return generateFallbackResponse(userMessage, agent);
    }

    const data = await response.json();
    return data.content?.[0]?.text || generateFallbackResponse(userMessage, agent);
  } catch (error) {
    console.error('Anthropic API call failed:', error);
    return generateFallbackResponse(userMessage, agent);
  }
}

async function callGoogle(
  systemPrompt: string,
  userMessage: string,
  agent: AIAgent,
  history: ChatMessage[]
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.warn('Google API key not configured, using fallback response');
    return generateFallbackResponse(userMessage, agent);
  }

  try {
    const contents = history
      .filter(m => m.role !== 'system')
      .reduce((acc: any[], msg, idx) => {
        if (msg.role === 'user') {
          acc.push({ role: 'user', parts: [{ text: msg.content }] });
        } else {
          if (acc[acc.length - 1]?.role === 'model') {
            acc[acc.length - 1].parts.push({ text: msg.content });
          } else {
            acc.push({ role: 'model', parts: [{ text: msg.content }] });
          }
        }
        return acc;
      }, []);

    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            maxOutputTokens: 4096,
            temperature: 0.7
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google API error:', response.status, errorData);
      return generateFallbackResponse(userMessage, agent);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || generateFallbackResponse(userMessage, agent);
  } catch (error) {
    console.error('Google API call failed:', error);
    return generateFallbackResponse(userMessage, agent);
  }
}

async function callCoze(
  systemPrompt: string,
  userMessage: string,
  agent: AIAgent,
  history: ChatMessage[]
): Promise<string> {
  const botId = process.env.COZE_BOT_ID;
  const apiKey = process.env.COZE_API_KEY;
  const cozeRegion = process.env.COZE_REGION || 'cn';
  
  if (!botId || !apiKey) {
    console.warn('Coze bot ID or API key not configured, using fallback response');
    return generateFallbackResponse(userMessage, agent);
  }

  try {
    const baseUrl = cozeRegion === 'cn' ? 'https://api.coze.cn' : 'https://api.coze.com';
    
    const messages = history
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content,
        content_type: 'text'
      }));

    const response = await fetch(`${baseUrl}/v3/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        bot_id: botId,
        user_id: 'new_media_user',
        stream: false,
        auto_save_history: true,
        additional_messages: [
          {
            role: 'system',
            content: systemPrompt,
            content_type: 'text'
          },
          ...messages,
          {
            role: 'user',
            content: userMessage,
            content_type: 'text'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Coze API error:', response.status, errorData);
      return generateFallbackResponse(userMessage, agent);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      console.error('Coze API returned error:', data.msg);
      return generateFallbackResponse(userMessage, agent);
    }
    
    const assistantMessage = data.data?.messages?.find(
      (msg: any) => msg.role === 'assistant' && msg.type === 'answer'
    );
    
    return assistantMessage?.content || generateFallbackResponse(userMessage, agent);
  } catch (error) {
    console.error('Coze API call failed:', error);
    return generateFallbackResponse(userMessage, agent);
  }
}

function generateFallbackResponse(
  userMessage: string,
  agent: AIAgent
): string {
  switch (agent.id) {
    case 'brainstorm':
      return generateBrainstormFallback(userMessage);
    case 'scriptwriter':
      return generateScriptFallback(userMessage);
    case 'postcreator':
      return generatePostFallback(userMessage);
    case 'sticker':
      return generateStickerFallback(userMessage);
    case 'strategist':
      return generateStrategyFallback(userMessage);
    default:
      return `收到您的消息：「${userMessage}」\n\n抱歉，目前 AI 服务暂时不可用，请稍后再试或联系管理员配置 AI API Key。`;
  }
}

function generateBrainstormFallback(userMessage: string): string {
  return `💡 关于「${userMessage}」，我有一些创意想法：

🎯 **创意方向 A**
从用户痛点出发，创造共鸣内容

🎯 **创意方向 B**  
用视觉冲击吸引眼球

🎯 **创意方向 C**
结合热点话题借势营销

🌟 **建议**：采用「系列化内容」策略，打造有辨识度的 IP！

请配置 AI API Key 以获得更精准的创意建议。`;
}

function generateScriptFallback(userMessage: string): string {
  return `📝 关于「${userMessage}」，脚本框架：

🎬 **开场（0-3秒）**
需要强吸引力的钩子

📍 **主体内容**
• 3-5个关键信息点
• 配合视觉呈现

🎯 **结尾行动号召**
明确告诉观众要做什么

⏱️ **时长建议**：15-60秒

请配置 AI API Key 以获得完整脚本。`;
}

function generatePostFallback(userMessage: string): string {
  return `✨ 关于「${userMessage}」的内容创作：

📝 **标题设计**
• 要有吸引力
• 可以用数字、疑问、感叹

💡 **正文结构**
• 开头抓眼球
• 中间有价值
• 结尾引导互动

🏷️ **标签策略**
• 2-3个热门大标签
• 3-5个精准小标签

请配置 AI API Key 以获得完整内容。`;
}

function generateStickerFallback(userMessage: string): string {
  return `🎨 关于「${userMessage}」的贴纸设计思路：

🌈 **设计概念**
• 主题：围绕${userMessage}展开
• 风格：可爱萌系 / 搞怪有趣 / 简约清新

✨ **设计元素建议**
• 核心形象：Q版卡通角色
• 表情：丰富多变的表情传达情感
• 动作：生动活泼的姿态

🎨 **配色方案**
• 主色调：明亮活泼的颜色
• 辅助色：搭配和谐的配色
• 渐变：柔和的色彩过渡

📱 **适用场景**
• 聊天软件表情
• 社交媒体配图
• 品牌宣传物料

请配置 AI API Key 以获得详细的设计方案。`;
}

function generateStrategyFallback(userMessage: string): string {
  return `🎯 关于「${userMessage}」的战略分析：

📊 **市场视角**
• 内容同质化严重，需要差异化
• 用户越来越注重真实性和价值

💡 **建议**
• 找准定位，建立独特风格
• 内容为王，不追求数量
• 用户思维，了解用户需求
• 长期主义，持续投入

请配置 AI API Key 以获得详细分析。`;
}
