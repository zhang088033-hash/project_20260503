import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir, access } from "fs/promises";
import { join } from "path";

const STORAGE_DIR = join(process.cwd(), "public", "uploads");

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
    const filePath = join(STORAGE_DIR, relativePath);

    // 确保目录存在
    const dirPath = join(STORAGE_DIR, `tasks/${taskId || "general"}`);
    try {
      await access(dirPath);
    } catch {
      await mkdir(dirPath, { recursive: true });
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 保存文件到本地
    await writeFile(filePath, buffer);

    // 生成访问URL
    const publicUrl = `/uploads/${relativePath}`;

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
        url: publicUrl,
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
