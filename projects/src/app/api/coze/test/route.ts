import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = process.env.COZE_API_KEY;
  const botId = process.env.COZE_BOT_ID;
  const cozeRegion = process.env.COZE_REGION || 'cn';

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'COZE_API_KEY 未配置'
    });
  }

  if (!botId) {
    return NextResponse.json({
      success: false,
      error: 'COZE_BOT_ID 未配置'
    });
  }

  try {
    const baseUrl = cozeRegion === 'cn' ? 'https://api.coze.cn' : 'https://api.coze.com';
    
    const response = await fetch(`${baseUrl}/v3/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        bot_id: botId,
        user_id: 'test_user',
        stream: false,
        auto_save_history: true,
        additional_messages: [
          {
            role: 'system',
            content: '你是一个友好的AI助手，请用简短的话回复。',
            content_type: 'text'
          },
          {
            role: 'user',
            content: '你好，请简单介绍一下你自己。',
            content_type: 'text'
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.code !== 0) {
      return NextResponse.json({
        success: false,
        error: `Coze API 错误: ${data.msg}`,
        code: data.code,
        baseUrl,
        botId
      });
    }

    const assistantMessage = data.data?.messages?.find(
      (msg: any) => msg.role === 'assistant' && msg.type === 'answer'
    );

    return NextResponse.json({
      success: true,
      connected: true,
      baseUrl,
      botId,
      response: assistantMessage?.content || '无响应内容',
      fullResponse: data.data
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      baseUrl: cozeRegion === 'cn' ? 'https://api.coze.cn' : 'https://api.coze.com'
    });
  }
}
