import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  ensureTaskAttachmentsBucketOnce,
  getSupabaseStorageClient,
  TASK_ATTACHMENTS_BUCKET,
} from "@/lib/supabase-storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const taskId = formData.get("taskId") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "没有文件" },
        { status: 400 }
      );
    }

    // 验证文件大小 (最大 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "文件大小不能超过 50MB" },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const ext = file.name.split(".").pop() || "";
    const fileId = uuidv4();
    const relativePath = `tasks/${taskId || "general"}/${fileId}.${ext}`;
    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = await ensureTaskAttachmentsBucketOnce();
    if (!bucket.ok) {
      console.error("存储桶初始化失败:", bucket.message);
      return NextResponse.json(
        { success: false, error: "存储未就绪，请稍后重试", detail: bucket.message },
        { status: 500 }
      );
    }

    const storage = getSupabaseStorageClient();
    const { error: uploadError } = await storage.storage
      .from(TASK_ATTACHMENTS_BUCKET)
      .upload(relativePath, buffer, {
        contentType: file.type || getMimeType(file.name),
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase 上传失败:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: "上传到存储失败，请稍后重试",
          detail: uploadError.message,
        },
        { status: 500 }
      );
    }

    // 推断MIME类型（浏览器可能不提供某些文件类型的MIME）
    const mimeType = file.type || getMimeType(file.name);

    return NextResponse.json({
      success: true,
      data: {
        id: fileId,
        name: file.name,
        size: file.size,
        type: mimeType,
        key: relativePath,
        url: `/api/download/${encodeURIComponent(relativePath)}`,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("上传文件失败:", error);
    return NextResponse.json(
      { success: false, error: "上传文件失败" },
      { status: 500 }
    );
  }
}

// 根据文件扩展名推断MIME类型
function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    csv: "text/csv",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
  };
  return mimeMap[ext] || "application/octet-stream";
}
