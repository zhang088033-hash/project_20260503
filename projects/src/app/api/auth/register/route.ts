import { NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, generateToken } from '@/lib/auth';

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

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json(
        { success: false, error: '用户名长度应为2-20个字符' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码长度不能少于6个字符' },
        { status: 400 }
      );
    }

    const db = await getDrizzleClient();

    // 检查用户名是否已存在
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: '用户名已存在' },
        { status: 409 }
      );
    }

    // 哈希密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const [user] = await db.insert(users)
      .values({
        username,
        password_hash: passwordHash,
      })
      .returning({ id: users.id, username: users.username });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '注册失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 生成 token
    const token = generateToken({ userId: user.id, username: user.username });

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username },
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { success: false, error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
