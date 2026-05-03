'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { Task, TaskFormData, Priority, Module, TaskAttachment } from '@/types/task';
import { MODULE_OPTIONS, PRIORITY_OPTIONS } from '@/types/task';
import { FileUpload as FileUploadComponent } from './FileUpload';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialData?: Task;
  mode: 'create' | 'edit';
  taskId?: number; // 用于编辑时上传附件
  onAttachmentsChange?: (taskId: number, attachments: TaskAttachment[]) => void;
}

export function TaskForm({ open, onOpenChange, onSubmit, initialData, mode, taskId, onAttachmentsChange }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'P1',
    module: '推广模块',
    deadline: '',
    deliverables: '',
    responsible_person: '',
    remark: ''
  });
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        priority: initialData.priority,
        module: initialData.module,
        deadline: initialData.deadline ? initialData.deadline.split('T')[0] : '',
        deliverables: initialData.deliverables || '',
        responsible_person: initialData.responsible_person || '',
        remark: initialData.remark || ''
      });
      setAttachments(initialData.attachments || []);
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'P1',
        module: '推广模块',
        deadline: '',
        deliverables: '',
        responsible_person: '',
        remark: ''
      });
      setAttachments([]);
    }
  }, [initialData, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '新增任务' : '编辑任务'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">任务标题 *</label>
            <Input
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入任务标题"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">优先级 *</label>
              <Select
                value={formData.priority}
                onValueChange={(value: Priority) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">模块 *</label>
              <Select
                value={formData.module}
                onValueChange={(value: Module) => setFormData(prev => ({ ...prev, module: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">完成时限</label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">责任人</label>
              <Input
                value={formData.responsible_person}
                onChange={e => setFormData(prev => ({ ...prev, responsible_person: e.target.value }))}
                placeholder="请输入责任人"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">任务描述</label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入任务描述"
              rows={3}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">核心交付物</label>
            <div className="flex gap-2">
              <Input
                value={formData.deliverables}
                onChange={e => setFormData(prev => ({ ...prev, deliverables: e.target.value }))}
                placeholder="请输入交付物名称"
                className="flex-1"
              />
              {mode === 'edit' && attachments.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {attachments.map((att, idx) => {
                    const isImage = att.type?.startsWith("image/");
                    return (
                      <div key={att.id || idx} className="flex items-center gap-1">
                        {isImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={att.url || `/api/download/${encodeURIComponent(att.key)}`}
                            alt={att.name}
                            className="w-8 h-8 object-cover rounded border"
                            onClick={() => { if (att.url) window.open(att.url, '_blank'); }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (att.url) window.open(att.url, '_blank');
                          }}
                        >
                          打开{isImage ? '图片' : ''}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/download/${encodeURIComponent(att.key)}`);
                              if (!response.ok) throw new Error('下载失败');
                              const blob = await response.blob();
                              const blobUrl = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = blobUrl;
                              link.download = att.name || 'download';
                              link.click();
                              window.URL.revokeObjectURL(blobUrl);
                            } catch {
                              if (att.url) window.open(att.url, '_blank');
                            }
                          }}
                        >
                          下载
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              {mode === 'edit' && attachments.length === 0 && (
                <span className="text-sm text-muted-foreground py-2">暂无附件</span>
              )}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">备注</label>
            <textarea
              value={formData.remark}
              onChange={e => setFormData(prev => ({ ...prev, remark: e.target.value }))}
              placeholder="请输入备注信息"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>

          {mode === 'edit' && taskId && (
            <div className="border-t pt-4 mt-4">
              <label className="text-sm font-medium mb-2 block">附件上传</label>
              <FileUploadComponent
                taskId={taskId}
                attachments={attachments}
                onAttachmentsChange={(newAttachments) => {
                  setAttachments(newAttachments);
                  if (onAttachmentsChange) {
                    onAttachmentsChange(taskId, newAttachments);
                  }
                }}
                disabled={submitting}
              />
            </div>
          )}
          
          {mode === 'create' && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 提示：创建任务后，可在编辑页面添加附件
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? '提交中...' : mode === 'create' ? '创建任务' : '保存修改'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
