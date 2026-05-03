"use client";

import { useState, useRef } from "react";
import { Upload, X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskAttachment } from "@/types/task";

interface FileUploadProps {
  taskId: number;
  attachments: TaskAttachment[];
  onAttachmentsChange: (attachments: TaskAttachment[]) => void;
  disabled?: boolean;
}

export function FileUpload({
  taskId,
  attachments,
  onAttachmentsChange,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const newAttachments = [...attachments];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("taskId", taskId.toString());

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          newAttachments.push(result.data);
        } else {
          setError(result.error || "上传失败");
        }
      }
      // 一次性更新所有附件
      onAttachmentsChange(newAttachments);
    } catch (err) {
      setError("上传失败，请重试");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments?attachmentId=${attachmentId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        onAttachmentsChange(result.data);
      } else {
        setError("删除失败");
      }
    } catch (err) {
      setError("删除失败，请重试");
      console.error("Delete error:", err);
    }
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      const response = await fetch(
        `/api/download/${encodeURIComponent(attachment.key)}`
      );

      if (!response.ok) {
        throw new Error("下载失败");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = attachment.name;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError("下载失败，请重试");
      console.error("Download error:", err);
    }
  };

  const handleOpen = (attachment: TaskAttachment) => {
    if (attachment.url) {
      window.open(attachment.url, "_blank");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isImageType = (type: string | undefined) => {
    if (!type) return false;
    return type.startsWith("image/");
  };

  const getFileIcon = (type: string | undefined) => {
    if (!type) return "📎";
    if (type.startsWith("image/")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("excel") || type.includes("sheet")) return "📊";
    if (type.includes("powerpoint") || type.includes("presentation")) return "📽️";
    if (type.includes("zip") || type.includes("rar")) return "📦";
    return "📎";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp"
          id="file-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {uploading ? "上传中..." : "上传文件"}
        </Button>
        <span className="text-xs text-muted-foreground">
          支持 PDF、Word、Excel、PPT、图片、压缩包（≤50MB）
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">已上传文件：</p>
          {/* 图片预览区域 */}
          {attachments.some(a => isImageType(a.type)) && (
            <div className="grid grid-cols-3 gap-2">
              {attachments.filter(a => isImageType(a.type)).map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative group border rounded-lg overflow-hidden bg-muted/30"
                >
                  <div
                    className="aspect-square cursor-pointer"
                    onClick={() => handleOpen(attachment)}
                    title={attachment.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachment.url || `/api/download/${encodeURIComponent(attachment.key)}`}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleOpen(attachment)}
                        title="打开"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      {!disabled && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDelete(attachment.id)}
                          title="删除"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                    {attachment.name}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* 非图片文件列表 */}
          {attachments.filter(a => !isImageType(a.type)).map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 border rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{getFileIcon(attachment.type)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate max-w-[200px]">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpen(attachment)}
                  title="打开"
                >
                  打开
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  title="下载"
                >
                  <Download className="w-4 h-4" />
                </Button>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment.id)}
                    title="删除"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
