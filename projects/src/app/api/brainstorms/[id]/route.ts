import { NextRequest, NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { brainstorms } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

function getUserFromRequest(request: NextRequest): { id: number; username: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return { id: decoded.userId, username: decoded.username };
}

// DELETE - 删除头脑风暴
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = await getDrizzleClient();
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;

    // 只能删除自己的
    const [existing] = await client
      .select({ username: brainstorms.username })
      .from(brainstorms)
      .where(eq(brainstorms.id, parseInt(id)));

    if (!existing) {
      return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 });
    }

    if (existing.username !== user.username) {
      return NextResponse.json({ success: false, error: '只能删除自己的意见' }, { status: 403 });
    }

    const result = await client.delete(brainstorms).where(eq(brainstorms.id, parseInt(id)));
    if (result.rowCount === 0) throw new Error('删除失败');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/brainstorms/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
