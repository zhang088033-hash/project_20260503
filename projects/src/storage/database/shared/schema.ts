import { pgTable, serial, timestamp, varchar, index, jsonb, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 附件类型定义
export interface TaskAttachment {
  id: string;
  name: string;
  key: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// 头脑风暴表
export const brainstorms = pgTable(
  "brainstorms",
  {
    id: serial().primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 50 }).notNull().default("general"),
    parent_id: integer("parent_id"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("brainstorms_username_idx").on(table.username),
    index("brainstorms_category_idx").on(table.category),
    index("brainstorms_parent_id_idx").on(table.parent_id),
  ]
);

// 需要引入 integer
import { integer } from "drizzle-orm/pg-core"

// 用户表
export const users = pgTable(
  "users",
  {
    id: serial().primaryKey(),
    username: varchar("username", { length: 100 }).notNull().unique(),  // 用户名（唯一）
    password_hash: text("password_hash").notNull(),                      // 密码哈希值
    display_name: varchar("display_name", { length: 100 }),              // 显示名称
    role: varchar("role", { length: 20 }).notNull().default("user"),     // 角色: admin/user
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

// 招商任务表
export const tasks = pgTable(
  "tasks",
  {
    id: serial().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),                    // 任务标题
    description: varchar("description", { length: 1000 }),                   // 任务描述
    priority: varchar("priority", { length: 10 }).notNull().default("P1"),  // P0/P1/P2
    module: varchar("module", { length: 50 }).notNull(),                    // 模块分类
    deadline: timestamp("deadline", { withTimezone: true }),                // 完成时限
    deliverables: varchar("deliverables", { length: 500 }),                // 核心交付物
    responsible_person: varchar("responsible_person", { length: 100 }),     // 责任人
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending/in_progress/completed
    attachments: jsonb("attachments").$type<TaskAttachment[]>().default([]), // 附件列表
    remark: varchar("remark", { length: 1000 }),                             // 备注
    created_by: varchar("created_by", { length: 100 }),                        // 创建者用户名
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("tasks_priority_idx").on(table.priority),                          // 优先级筛选
    index("tasks_module_idx").on(table.module),                              // 模块筛选
    index("tasks_status_idx").on(table.status),                              // 状态筛选
    index("tasks_deadline_idx").on(table.deadline),                          // 时限排序
  ]
);
