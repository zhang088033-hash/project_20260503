import { getDrizzleClient } from "@/storage/database/supabase-client";
import { NextRequest, NextResponse } from "next/server";
import type { TaskAttachment } from "@/types/task";
import { tasks } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";

const BUCKET_NAME = "task-attachments";

// 添加附件到任务
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);
    
    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, error: "无效的任务ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const attachment: TaskAttachment = body.attachment;

    if (!attachment || !attachment.key) {
      return NextResponse.json(
        { success: false, error: "无效的附件信息" },
        { status: 400 }
      );
    }

    const client = await getDrizzleClient();

    // 获取当前任务的附件
    const [task] = await client
      .select({ attachments: tasks.attachments })
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 添加新附件
    const currentAttachments = (task.attachments || []) as TaskAttachment[];
    const newAttachments = [...currentAttachments, attachment];

    // 更新任务
    await client
      .update(tasks)
      .set({ attachments: newAttachments, updated_at: new Date().toISOString() })
      .where(eq(tasks.id, taskId));

    return NextResponse.json({
      success: true,
      data: newAttachments,
    });
  } catch (error) {
    console.error("添加附件失败:", error);
    return NextResponse.json(
      { success: false, error: "添加附件失败" },
      { status: 500 }
    );
  }
}

// 删除附件
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");

    if (isNaN(taskId) || !attachmentId) {
      return NextResponse.json(
        { success: false, error: "无效的参数" },
        { status: 400 }
      );
    }

    const client = await getDrizzleClient();

    // 获取当前任务的附件
    const [task] = await client
      .select({ attachments: tasks.attachments })
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 过滤掉要删除的附件
    const currentAttachments = (task.attachments || []) as TaskAttachment[];
    const attachmentToDelete = currentAttachments.find((a) => a.id === attachmentId);
    
    // 从 Supabase Storage 删除文件（如果配置了）
    if (attachmentToDelete?.key) {
      try {
        const supabaseUrl = process.env.COZE_SUPABASE_URL;
        const supabaseKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseKey) {
          await fetch(
            `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${attachmentToDelete.key}`,
            {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${supabaseKey}`,
              },
            }
          );
        }
      } catch (e) {
        console.warn("删除存储文件失败:", e);
      }
    }

    const newAttachments = currentAttachments.filter((a) => a.id !== attachmentId);

    // 更新任务
    await client
      .update(tasks)
      .set({ attachments: newAttachments, updated_at: new Date().toISOString() })
      .where(eq(tasks.id, taskId));

    return NextResponse.json({
      success: true,
      data: newAttachments,
    });
  } catch (error) {
    console.error("删除附件失败:", error);
    return NextResponse.json(
      { success: false, error: "删除附件失败" },
      { status: 500 }
    );
  }
}

// 获取附件下载链接
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");

    if (isNaN(taskId) || !attachmentId) {
      return NextResponse.json(
        { success: false, error: "无效的参数" },
        { status: 400 }
      );
    }

    const client = await getDrizzleClient();

    // 获取任务
    const [task] = await client
      .select({ attachments: tasks.attachments })
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 查找附件
    const currentAttachments = (task.attachments || []) as TaskAttachment[];
    const attachment = currentAttachments.find((a) => a.id === attachmentId);

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: "附件不存在" },
        { status: 404 }
      );
    }

    // 使用公开 URL 作为下载链接
    const supabaseUrl = process.env.COZE_SUPABASE_URL;
    const publicUrl = attachment.url || `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${attachment.key}`;

    return NextResponse.json({
      success: true,
      data: { url: publicUrl, name: attachment.name },
    });
  } catch (error) {
    console.error("获取下载链接失败:", error);
    return NextResponse.json(
      { success: false, error: "获取下载链接失败" },
      { status: 500 }
    );
  }
}
