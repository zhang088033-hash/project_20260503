import { pgTable, serial, timestamp, varchar, index, jsonb, text, integer, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export interface TaskAttachment {
  id: string;
  name: string;
  key: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export const brainstorms = pgTable(
  "brainstorms",
  {
    id: serial().primaryKey(),
    task_id: integer("task_id"),
    username: varchar("username", { length: 100 }).notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 50 }).notNull().default("general"),
    parent_id: integer("parent_id"),
    is_ai: boolean("is_ai").default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("brainstorms_task_id_idx").on(table.task_id),
    index("brainstorms_username_idx").on(table.username),
    index("brainstorms_category_idx").on(table.category),
    index("brainstorms_parent_id_idx").on(table.parent_id),
  ]
);

export const users = pgTable(
  "users",
  {
    id: serial().primaryKey(),
    username: varchar("username", { length: 100 }).notNull().unique(),
    password_hash: text("password_hash").notNull(),
    display_name: varchar("display_name", { length: 100 }),
    role: varchar("role", { length: 20 }).notNull().default("user"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("users_username_idx").on(table.username),
  ]
);

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: serial().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 1000 }),
    priority: varchar("priority", { length: 10 }).notNull().default("P1"),
    module: varchar("module", { length: 50 }).notNull(),
    deadline: timestamp("deadline", { withTimezone: true }),
    deliverables: varchar("deliverables", { length: 500 }),
    responsible_person: varchar("responsible_person", { length: 100 }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    attachments: jsonb("attachments").$type<TaskAttachment[]>().default([]),
    remark: varchar("remark", { length: 1000 }),
    created_by: varchar("created_by", { length: 100 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("tasks_priority_idx").on(table.priority),
    index("tasks_module_idx").on(table.module),
    index("tasks_status_idx").on(table.status),
    index("tasks_deadline_idx").on(table.deadline),
  ]
);

export const aiEditorSessions = pgTable(
  "ai_editor_sessions",
  {
    id: serial().primaryKey(),
    user_id: integer("user_id").notNull(),
    username: varchar("username", { length: 100 }).notNull(),
    title: varchar("title", { length: 200 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("ai_editor_sessions_user_id_idx").on(table.user_id),
    index("ai_editor_sessions_username_idx").on(table.username),
  ]
);

export const aiEditorMessages = pgTable(
  "ai_editor_messages",
  {
    id: serial().primaryKey(),
    session_id: integer("session_id").notNull(),
    role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
    content: text("content").notNull(),
    content_type: varchar("content_type", { length: 50 }).default("text"), // 'text', 'idea', 'script', 'post'
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ai_editor_messages_session_id_idx").on(table.session_id),
    index("ai_editor_messages_role_idx").on(table.role),
    index("ai_editor_messages_content_type_idx").on(table.content_type),
  ]
);
