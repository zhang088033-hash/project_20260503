import { NextRequest, NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { tasks } from '@/storage/database/shared/schema';
import { eq, gte, lte, lt, ne, and, orderBy } from 'drizzle-orm';
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
    
    let query = client.select().from(tasks);
    
    if (taskModule) {
      query = query.where(eq(tasks.module, taskModule));
    }
    if (priority) {
      query = query.where(eq(tasks.priority, priority));
    }
    if (status) {
      query = query.where(eq(tasks.status, status));
    }
    if (responsiblePerson) {
      query = query.where(eq(tasks.responsible_person, responsiblePerson));
    }
    if (today === 'true') {
      const todayStr = new Date().toISOString().split('T')[0];
      query = query.where(and(
        gte(tasks.deadline, `${todayStr}T00:00:00`),
        lte(tasks.deadline, `${todayStr}T23:59:59`)
      ));
    }
    if (overdue === 'true') {
      const now = new Date();
      query = query.where(and(
        lt(tasks.deadline, now),
        ne(tasks.status, 'completed')
      ));
    }
    if (createdBy) {
      query = query.where(eq(tasks.created_by, createdBy));
    }
    
    query = query.orderBy(tasks.deadline);
    
    const data = await query;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '查询失败' },
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
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}
