import { NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { aiEditorSessions, aiEditorMessages } from '@/storage/database/shared/schema';

export async function POST() {
  try {
    const client = await getDrizzleClient();

    await client.execute(`
      CREATE TABLE IF NOT EXISTS "ai_editor_sessions" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL,
        "username" text NOT NULL,
        "title" text NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS "ai_editor_messages" (
        "id" serial PRIMARY KEY,
        "session_id" integer NOT NULL,
        "role" text NOT NULL,
        "content" text NOT NULL,
        "content_type" text DEFAULT 'text',
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE INDEX IF NOT EXISTS "ai_editor_sessions_user_id_idx" ON "ai_editor_sessions" ("user_id");
    `);

    await client.execute(`
      CREATE INDEX IF NOT EXISTS "ai_editor_sessions_username_idx" ON "ai_editor_sessions" ("username");
    `);

    await client.execute(`
      CREATE INDEX IF NOT EXISTS "ai_editor_messages_session_id_idx" ON "ai_editor_messages" ("session_id");
    `);

    await client.execute(`
      CREATE INDEX IF NOT EXISTS "ai_editor_messages_role_idx" ON "ai_editor_messages" ("role");
    `);

    await client.execute(`
      CREATE INDEX IF NOT EXISTS "ai_editor_messages_content_type_idx" ON "ai_editor_messages" ("content_type");
    `);

    return NextResponse.json({
      success: true,
      message: 'AI Editor tables created successfully'
    });
  } catch (error) {
    console.error('Init AI Editor tables error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '创建表失败'
    }, { status: 500 });
  }
}
