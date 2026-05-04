import { NextRequest, NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { aiEditorSessions, aiEditorMessages } from '@/storage/database/shared/schema';
import { verifyToken } from '@/lib/auth';
import { eq, and, asc } from 'drizzle-orm';
import { generateAIResponseWithModel } from '@/lib/ai-service';
import { getAgentById, getDefaultAgent } from '@/lib/ai-agents';
import { getModelById, getDefaultModel, AIModel } from '@/lib/ai-models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;
    const sessionId = parseInt(id);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) {
      return NextResponse.json({ success: false, error: '无效的会话ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content, agent_id, model_id } = body;

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
        content_type: agent_id || 'brainstorm',
      });

    const agent = getAgentById(agent_id) || getDefaultAgent();
    const model = getModelById(model_id as AIModel) || getDefaultModel();
    
    console.log('Generating AI response:', { agent: agent.id, model: model.id, modelName: model.name });
    
    const historyMessages = await client
      .select()
      .from(aiEditorMessages)
      .where(eq(aiEditorMessages.session_id, sessionId))
      .orderBy(asc(aiEditorMessages.created_at));

    const conversationHistory = historyMessages
      .filter(msg => msg.role !== 'user' || msg.id !== historyMessages[historyMessages.length - 1]?.id)
      .map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }));

    console.log('Calling generateAIResponseWithModel...');
    const aiResponse = await generateAIResponseWithModel(
      content.trim(),
      agent,
      model,
      conversationHistory
    );
    console.log('AI Response received:', aiResponse.substring(0, 100) + '...');

    const [assistantMsg] = await client
      .insert(aiEditorMessages)
      .values({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        content_type: agent_id || 'brainstorm',
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
