import { NextRequest, NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { brainstorms, tasks } from '@/storage/database/shared/schema';
import { eq, isNotNull, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

function getUserFromRequest(request: NextRequest): { id: number; username: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return { id: decoded.userId, username: decoded.username };
}

// GET - 获取头脑风暴（按任务ID筛选）
export async function GET(request: NextRequest) {
  try {
    const client = await getDrizzleClient();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    const category = searchParams.get('category');

    if (!taskId) {
      return NextResponse.json({ success: false, error: '缺少 task_id 参数' }, { status: 400 });
    }

    const parsedTaskId = parseInt(taskId);
    if (isNaN(parsedTaskId)) {
      return NextResponse.json({ success: false, error: '无效的 task_id' }, { status: 400 });
    }

    const conditions = [eq(brainstorms.task_id, parsedTaskId)];
    if (category) {
      conditions.push(eq(brainstorms.category, category));
    }

    const query = client
      .select()
      .from(brainstorms)
      .where(and(...conditions))
      .orderBy(brainstorms.created_at);

    const data = await query;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/brainstorms error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '查询失败' },
      { status: 500 }
    );
  }
}

// POST - 创建头脑风暴（支持 AI 辅助）
export async function POST(request: NextRequest) {
  try {
    const client = await getDrizzleClient();
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { content, task_id, parent_id, category, isAi } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ success: false, error: '内容不能为空' }, { status: 400 });
    }

    if (!task_id) {
      return NextResponse.json({ success: false, error: '缺少 task_id' }, { status: 400 });
    }

    // 验证任务存在
    const [taskData] = await client
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.id, parseInt(task_id)));

    if (!taskData) {
      return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
    }

    // 创建头脑风暴
    const [data] = await client
      .insert(brainstorms)
      .values({
        task_id: parseInt(task_id),
        username: isAi ? 'AI助手' : user.username,
        content: content.trim(),
        category: category || 'general',
        parent_id: parent_id ? parseInt(parent_id) : null,
        is_ai: isAi ? true : false,
      })
      .returning();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('POST /api/brainstorms error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}
