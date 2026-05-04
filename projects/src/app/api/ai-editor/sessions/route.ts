import { NextRequest, NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { aiEditorSessions } from '@/storage/database/shared/schema';
import { verifyToken } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const client = await getDrizzleClient();
    const sessions = await client
      .select()
      .from(aiEditorSessions)
      .where(eq(aiEditorSessions.user_id, user.id))
      .orderBy(desc(aiEditorSessions.updated_at));

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error('GET /api/ai-editor/sessions error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取会话列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    const client = await getDrizzleClient();
    const [session] = await client
      .insert(aiEditorSessions)
      .values({
        user_id: user.id,
        username: user.username,
        title: title || '新对话',
      })
      .returning();

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('POST /api/ai-editor/sessions error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建会话失败' },
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
