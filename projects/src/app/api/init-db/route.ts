import { NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const client = await getDrizzleClient();
    
    // 检查并创建表
    await client.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name VARCHAR(100),
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      )
    `);

    await client.execute(sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description VARCHAR(1000),
        priority VARCHAR(10) NOT NULL DEFAULT 'P1',
        module VARCHAR(50) NOT NULL,
        deadline TIMESTAMP WITH TIME ZONE,
        deliverables VARCHAR(500),
        responsible_person VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        attachments JSONB DEFAULT '[]'::jsonb,
        remark VARCHAR(1000),
        created_by VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      )
    `);

    await client.execute(sql`
      CREATE TABLE IF NOT EXISTS brainstorms (
        id SERIAL PRIMARY KEY,
        task_id INTEGER,
        username VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'general',
        parent_id INTEGER,
        is_ai BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    await client.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_editor_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        username VARCHAR(100) NOT NULL,
        title VARCHAR(200),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      )
    `);

    await client.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_editor_messages (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        content_type VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // 创建索引
    await client.execute(sql`CREATE INDEX IF NOT EXISTS users_username_idx ON users(username)`);
    await client.execute(sql`CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority)`);
    await client.execute(sql`CREATE INDEX IF NOT EXISTS tasks_module_idx ON tasks(module)`);
    await client.execute(sql`CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status)`);
    await client.execute(sql`CREATE INDEX IF NOT EXISTS brainstorms_task_id_idx ON brainstorms(task_id)`);
    await client.execute(sql`CREATE INDEX IF NOT EXISTS brainstorms_username_idx ON brainstorms(username)`);
    await client.execute(sql`CREATE INDEX IF NOT EXISTS ai_editor_sessions_user_id_idx ON ai_editor_sessions(user_id)`);
    await client.execute(sql`CREATE INDEX IF NOT EXISTS ai_editor_sessions_username_idx ON ai_editor_sessions(username)`);
    await client.execute(sql`CREATE INDEX IF NOT EXISTS ai_editor_messages_session_id_idx ON ai_editor_messages(session_id)`);
    await client.execute(sql`CREATE INDEX IF NOT EXISTS ai_editor_messages_role_idx ON ai_editor_messages(role)`);

    return NextResponse.json({ success: true, message: '数据库表已初始化' });
  } catch (error) {
    console.error('Database init error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '初始化失败' },
      { status: 500 }
    );
  }
}