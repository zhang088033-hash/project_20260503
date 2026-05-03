import { NextRequest, NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { tasks } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

// 获取单个任务
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await getDrizzleClient();
    
    const [data] = await client
      .select()
      .from(tasks)
      .where(eq(tasks.id, parseInt(id)));
    
    if (!data) throw new Error('任务不存在');
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '查询失败' },
      { status: 500 }
    );
  }
}

// 更新任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await getDrizzleClient();
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };
    
    // 只更新提供的字段
    const allowedFields = ['title', 'description', 'priority', 'module', 'deadline', 'deliverables', 'responsible_person', 'status', 'remark', 'attachments'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'deadline' && body[field]) {
          updateData[field] = new Date(body[field]);
        } else if (field === 'deadline' && !body[field]) {
          updateData[field] = null;
        } else {
          updateData[field] = body[field];
        }
      }
    }
    
    const [data] = await client
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, parseInt(id)))
      .returning();
    
    if (!data) throw new Error('更新任务失败');
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('PUT /api/tasks/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
}

// 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await getDrizzleClient();
    
    const result = await client
      .delete(tasks)
      .where(eq(tasks.id, parseInt(id)));
    
    if (result.rowCount === 0) throw new Error('删除任务失败');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
