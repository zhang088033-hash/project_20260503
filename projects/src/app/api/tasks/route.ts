import { NextRequest, NextResponse } from 'next/server';
import { formatDatabaseError } from '@/lib/db-error';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { tasks } from '@/storage/database/shared/schema';
import { eq, gte, lte, lt, ne, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

// 从请求头获取当前用户
function getUserFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  return decoded?.username || null;
}

// 获取所有任务
export async function GET(request: NextRequest) {
  try {
    const client = await getDrizzleClient();
    const { searchParams } = new URL(request.url);
    
    const taskModule = searchParams.get('module');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const responsiblePerson = searchParams.get('responsible_person');
    const today = searchParams.get('today');
    const overdue = searchParams.get('overdue');
    const createdBy = searchParams.get('created_by');
    
    const conditions = [];
    
    if (taskModule) {
      conditions.push(eq(tasks.module, taskModule));
    }
    if (priority) {
      conditions.push(eq(tasks.priority, priority));
    }
    if (status) {
      conditions.push(eq(tasks.status, status));
    }
    if (responsiblePerson) {
      conditions.push(eq(tasks.responsible_person, responsiblePerson));
    }
    if (today === 'true') {
      const todayStr = new Date().toISOString().split('T')[0];
      conditions.push(and(
        gte(tasks.deadline, new Date(`${todayStr}T00:00:00`)),
        lte(tasks.deadline, new Date(`${todayStr}T23:59:59`))
      ));
    }
    if (overdue === 'true') {
      const now = new Date();
      conditions.push(and(
        lt(tasks.deadline, now),
        ne(tasks.status, 'completed')
      ));
    }
    if (createdBy) {
      conditions.push(eq(tasks.created_by, createdBy));
    }
    
    const data = await client
      .select()
      .from(tasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(tasks.deadline);
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json(
      { success: false, error: formatDatabaseError(error) },
      { status: 500 }
    );
  }
}

// 创建新任务
export async function POST(request: NextRequest) {
  try {
    const client = await getDrizzleClient();
    const body = await request.json();
    
    const { title, description, priority, module: taskModule, deadline, deliverables, responsible_person, remark } = body;
    const createdBy = getUserFromRequest(request);
    
    if (!title || !priority || !taskModule) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    const [data] = await client
      .insert(tasks)
      .values({
        title,
        description,
        priority,
        module: taskModule,
        deadline: deadline ? new Date(deadline) : null,
        deliverables,
        responsible_person,
        remark,
        created_by: createdBy,
        status: 'pending'
      })
      .returning();
    
    if (!data) throw new Error('创建任务失败');
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json(
      { success: false, error: formatDatabaseError(error) },
      { status: 500 }
    );
  }
}
