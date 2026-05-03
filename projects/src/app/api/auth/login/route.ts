import { NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    const db = await getDrizzleClient();

    // 查找用户
    const user = await db.select({ id: users.id, username: users.username, passwordHash: users.password_hash })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(password, user[0].passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 生成 token
    const token = generateToken({ userId: user[0].id, username: user[0].username });

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: { id: user[0].id, username: user[0].username },
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
