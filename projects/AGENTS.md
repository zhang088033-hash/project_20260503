# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

## 项目说明

### 圳铺-罗湖星宠汇招商任务管理系统

本项目是圳铺罗湖星宠汇招商项目的专属任务管理工具，用于招商政务管理，支持全周期任务管理。

### 核心功能

- 用户认证系统（注册/登录，bcrypt 哈希密码，JWT token 鉴权）
- 任务CRUD操作（创建、读取、更新、删除）
- 智能查询（今日待办、逾期预警、模块筛选、责任人筛选）
- 任务状态管理（待处理、进行中、已完成）
- 优先级管理（P0/P1/P2）
- 责任人分类统计和筛选
- 文件附件上传/下载（Supabase Storage）
- 备注字段
- 数据可视化统计

### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册（密码 bcrypt 哈希） |
| `/api/auth/login` | POST | 用户登录（返回 JWT token） |
| `/api/auth/me` | GET | 获取当前用户信息（需 Authorization header） |
| `/api/tasks` | GET | 获取任务列表（支持模块、优先级、状态、责任人筛选） |
| `/api/tasks` | POST | 创建新任务 |
| `/api/tasks/[id]` | GET | 获取单个任务 |
| `/api/tasks/[id]` | PUT | 更新任务 |
| `/api/tasks/[id]` | DELETE | 删除任务 |
| `/api/tasks/[id]/attachments` | GET/POST/DELETE | 任务附件管理 |
| `/api/tasks/init` | GET | 检查初始化状态 |
| `/api/tasks/init` | POST | 初始化预设任务数据 |
| `/api/upload` | POST | 文件上传（Supabase Storage） |
| `/api/download/[key]` | GET | 文件下载 |

### 数据库

- 使用 Supabase PostgreSQL 存储
- 核心表：
  - `tasks`（任务表）：id, title, description, priority, module, deadline, deliverables, responsible_person, status, attachments(JSONB), remark, created_at, updated_at
  - `users`（用户表）：id, username(UNIQUE), password_hash, display_name, role, created_at, updated_at
- 文件存储：Supabase Storage（bucket: task-attachments）

### 认证机制

- 密码使用 bcryptjs 哈希存储（salt rounds: 10）
- JWT token 有效期 7 天，存储在 localStorage
- 前端通过 `/api/auth/me` 验证 token 有效性
- 登录后显示用户名和退出按钮

### 模块分类

- 推广模块
- 达人对接模块
- 物料模块
- 场地搭建模块
- 招商政策模块
- 品牌合作模块
- 活动策划模块
- 其他
