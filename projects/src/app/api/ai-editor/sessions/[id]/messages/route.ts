import { NextRequest, NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { aiEditorSessions, aiEditorMessages } from '@/storage/database/shared/schema';
import { verifyToken } from '@/lib/auth';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const sessionId = parseInt(params.id);
    if (isNaN(sessionId)) {
      return NextResponse.json({ success: false, error: '无效的会话ID' }, { status: 400 });
    }

    const client = await getDrizzleClient();
    const messages = await client
      .select()
      .from(aiEditorMessages)
      .where(eq(aiEditorMessages.session_id, sessionId))
      .orderBy(asc(aiEditorMessages.created_at));

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error('GET /api/ai-editor/sessions/[id]/messages error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取消息失败' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const sessionId = parseInt(params.id);
    if (isNaN(sessionId)) {
      return NextResponse.json({ success: false, error: '无效的会话ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content, content_type } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ success: false, error: '内容不能为空' }, { status: 400 });
    }

    const client = await getDrizzleClient();
    
    const [session] = await client
      .select()
      .from(aiEditorSessions)
      .where(and(eq(aiEditorSessions.id, sessionId), eq(aiEditorSessions.user_id, user.id)));
    
    if (!session) {
      return NextResponse.json({ success: false, error: '会话不存在' }, { status: 404 });
    }

    await client
      .insert(aiEditorMessages)
      .values({
        session_id: sessionId,
        role: 'user',
        content: content.trim(),
        content_type: content_type || 'text',
      });

    const aiResponse = generateAIResponse(content.trim(), content_type);

    const [assistantMsg] = await client
      .insert(aiEditorMessages)
      .values({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        content_type: content_type || 'text',
      })
      .returning();

    await client
      .update(aiEditorSessions)
      .set({ updated_at: new Date() })
      .where(eq(aiEditorSessions.id, sessionId));

    return NextResponse.json({ success: true, data: assistantMsg });
  } catch (error) {
    console.error('POST /api/ai-editor/sessions/[id]/messages error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '发送消息失败' },
      { status: 500 }
    );
  }
}

function getUserFromRequest(request: NextRequest): { id: number; username: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return { id: decoded.userId, username: decoded.username };
}

function generateAIResponse(content: string, content_type: string = 'text'): string {
  const lowerContent = content.toLowerCase();
  
  if (content_type === 'idea' || lowerContent.includes('创意') || lowerContent.includes('idea')) {
    return generateIdeaResponse(content);
  } else if (content_type === 'script' || lowerContent.includes('脚本') || lowerContent.includes('script')) {
    return generateScriptResponse(content);
  } else if (content_type === 'post' || lowerContent.includes('帖子') || lowerContent.includes('推文') || lowerContent.includes('post')) {
    return generatePostResponse(content);
  } else if (lowerContent.includes('namaste') || lowerContent.includes('宠物')) {
    return generatePetContentResponse(content);
  } else {
    return generateGeneralResponse(content);
  }
}

function generateIdeaResponse(content: string): string {
  return `🎨 关于「${content}」的新媒体创意建议：

💡 **创意方向**：
1. 情感共鸣型 - 讲述温暖的宠物故事，打动用户内心
2. 实用指南型 - 提供实用的养宠知识和技巧
3. 互动挑战型 - 发起有趣的宠物挑战活动
4. 对比反差型 - 通过有趣的对比制造话题

📱 **内容形式建议**：
- 短视频（15-60秒）：适合快速传播
- 图文笔记：深度种草和科普
- 直播互动：建立粉丝粘性
- 系列内容：打造品牌IP

🎯 **推荐平台**：
- 抖音/视频号：适合情感向和娱乐向内容
- 小红书：适合种草和实用指南
- 微信公众号：适合深度长文
- 微博：适合话题互动

需要我帮你具体展开哪个方向吗？`;
}

function generateScriptResponse(content: string): string {
  return `📝 为您生成「${content}」的脚本框架：

🎬 **脚本结构**：

【开场 0-5秒】
• 黄金三秒钩子
• 视觉冲击或情感激发
• 点明主题

【主体 5-45秒】
• 3-5个关键信息点
• 层层递进的叙事节奏
• 可视化的场景呈现

【结尾 45-60秒】
• 情感升华或实用总结
• 行动号召（关注/点赞/评论）
• 引导互动

💡 **示例脚本片段**：
> （音乐起）你知道吗？宠物也会有情绪！
> （画面切换）今天教你3招读懂毛孩子的心声...
> （互动）你家毛孩子有什么可爱的小怪癖？评论区聊聊！

需要我帮你写完整脚本吗？`;
}

function generatePostResponse(content: string): string {
  return `✨ 为「${content}」生成的社交媒体帖子内容：

📝 **标题建议**：
1. 《谁懂啊！这才是新媒体人该有的灵感！》
2. 《爆款密码：我找到了流量密码！》
3. 《绝了！这个创意能让你的内容火出圈！》

📖 **正文内容**：
> 家人们！今天给大家分享一个超级实用的创意💡
> 
> （核心内容点1）
> （核心内容点2）
> （核心内容点3）
> 
> 💬 互动话题：你最喜欢哪个创意？评论区聊聊！
> 
> 记得点赞收藏关注，持续分享干货！✨

🏷️ **标签建议**：
#新媒体运营 #内容创作 #创意灵感 #爆款内容 #干货分享

需要调整风格吗？`;
}

function generatePetContentResponse(content: string): string {
  return `🐾 关于「${content}」的宠物内容创作建议：

🌟 **Namaste 风格创意灵感**：

1. **治愈系日常** - 记录宠物温暖的日常瞬间
   • 早上叫醒主人的可爱瞬间
   • 陪伴工作的暖心画面
   • 一起看日落的温馨时刻

2. **趣味挑战** - 发起宠物挑战活动
   • 宠物模仿秀
   • 技能大比拼
   • 变装挑战

3. **实用科普** - 提供养宠知识
   • 新手养宠指南
   • 宠物行为解读
   • 健康护理小贴士

4. **情感故事** - 讲述人宠温情
   • 领养故事
   • 感人瞬间
   • 成长记录

🎨 **视觉呈现技巧**：
• 暖色调滤镜营造温馨感
• 慢动作捕捉可爱瞬间
• 特写镜头展现细节
• 配上治愈系BGM

需要我帮你构思具体内容吗？`;
}

function generateGeneralResponse(content: string): string {
  return `👋 你好！我是你的新媒体部 AI Editor！

针对「${content}」，我可以帮你：

💡 **创意策划** -  brainstorm 有趣的内容创意
📝 **脚本撰写** - 撰写短视频和直播脚本
✨ **帖子创作** - 生成社交媒体帖子内容
🎯 **主题讨论** - 深入探讨任何话题

请告诉我你想做什么类型的内容？
（例如：告诉我"帮我想一个宠物视频创意"或"写一个关于Namaste的脚本"）`;
}
