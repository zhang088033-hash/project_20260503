import { NextRequest, NextResponse } from "next/server";
import { readFile, access } from "fs/promises";
import { join } from "path";

const STORAGE_DIR = join(process.cwd(), "public", "uploads");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    
    // 解码URL编码的key
    const relativePath = decodeURIComponent(key);
    const filePath = join(STORAGE_DIR, relativePath);
    
    // 检查文件是否存在
    try {
      await access(filePath);
    } catch {
      console.error(`文件不存在: ${filePath}`);
      return NextResponse.json(
        { success: false, error: "文件不存在或已被删除" },
        { status: 404 }
      );
    }

    // 读取文件
    const buffer = await readFile(filePath);
    
    // 从key中提取文件名
    const fileName = relativePath.split("/").pop() || "download";
    const contentType = getMimeType(fileName);
    
    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("下载文件失败:", error);
    return NextResponse.json(
      { success: false, error: "下载文件失败" },
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
