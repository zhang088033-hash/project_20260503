'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TaskForm } from './TaskForm';
import { TaskBrainstorm } from '@/components/brainstorm/BrainstormMap';
import type { Task, TaskFormData, Status, TaskAttachment } from '@/types/task';
import { PRIORITY_CONFIG, STATUS_OPTIONS } from '@/types/task';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Paperclip, Download, User, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  onUpdateStatus: (id: number, status: Status) => Promise<Task | null>;
  onUpdate: (id: number, data: Partial<Task>) => Promise<Task | null>;
  onDelete: (id: number) => Promise<boolean>;
  currentUser: { id: number; username: string };
}

export function TaskTable({ tasks, onUpdateStatus, onUpdate, onDelete, currentUser }: TaskTableProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  const handleStatusChange = async (taskId: number, newStatus: Status) => {
    await onUpdateStatus(taskId, newStatus);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowEditForm(true);
  };

  const handleEditSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await onUpdate(editingTask.id, data);
    }
  };

  const handleDelete = async () => {
    if (deletingTaskId !== null) {
      setDeleting(true);
      await onDelete(deletingTaskId);
      setDeleting(false);
      setDeletingTaskId(null);
    }
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return '-';
    try {
      return format(new Date(deadline), 'yyyy-MM-dd', { locale: zhCN });
    } catch {
      return '-';
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.deadline || task.status === 'completed') return false;
    return new Date(task.deadline) < new Date();
  };

  return (
    <>
      {/* 手机端横向滚动支持 */}
      <div className="overflow-x-auto -mx-4 px-4 touch-pan-x">
        <div className="rounded-md border min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12">优先级</TableHead>
                <TableHead>任务明细</TableHead>
                <TableHead className="w-24">模块</TableHead>
                <TableHead className="w-28">完成时限</TableHead>
                <TableHead>核心交付物</TableHead>
                <TableHead className="w-28">备注</TableHead>
                <TableHead className="w-20">责任人</TableHead>
                <TableHead className="w-28">状态</TableHead>
                <TableHead className="w-36">附件</TableHead>
                <TableHead className="w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  暂无任务
                </TableCell>
              </TableRow>
            ) : (
              tasks.map(task => (
                <>
                  <TableRow 
                    key={task.id}
                    className={isOverdue(task) ? 'bg-red-50' : ''}
                  >
                    {/* 展开按钮 */}
                    <TableCell className="w-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                        title="展开头脑风暴"
                      >
                        {expandedTaskId === task.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={`${PRIORITY_CONFIG[task.priority].bgColor} ${PRIORITY_CONFIG[task.priority].color} font-medium`}
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </div>
                        )}
                        {task.created_by && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                            <User className="w-3 h-3" />
                            <span>{task.created_by}</span>
                          </div>
                        )}
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Paperclip className="w-3 h-3" />
                            <span>{task.attachments.length}个附件</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{task.module}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${isOverdue(task) ? 'text-red-600 font-medium' : ''}`}>
                        {formatDeadline(task.deadline)}
                        {isOverdue(task) && <span className="ml-1 text-xs">(逾期)</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {task.deliverables || '-'}
                    </TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate" title={task.remark || ''}>
                      {task.remark || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {task.responsible_person || '-'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={task.status}
                        onValueChange={(value: Status) => handleStatusChange(task.id, value)}
                      >
                        <SelectTrigger className={`h-8 text-xs ${STATUS_OPTIONS.find(s => s.value === task.status)?.color}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {task.attachments && task.attachments.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {task.attachments.map((att: TaskAttachment, index: number) => {
                            const isImage = att.type?.startsWith("image/");
                            return (
                              <div key={att.id || index} className="flex items-center gap-1">
                                {isImage ? (
                                  <div className="flex items-center gap-1">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={att.url || `/api/download/${encodeURIComponent(att.key)}`}
                                      alt={att.name}
                                      className="w-8 h-8 object-cover rounded border"
                                      onClick={() => {
                                        if (att.url) window.open(att.url, "_blank");
                                      }}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-6 text-xs p-0 max-w-[80px] truncate"
                                      onClick={() => {
                                        if (att.url) window.open(att.url, "_blank");
                                      }}
                                      title={`打开: ${att.name}`}
                                    >
                                      {att.name || '查看'}
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-6 text-xs p-0 max-w-[100px] truncate"
                                    onClick={() => {
                                      if (att.url) window.open(att.url, "_blank");
                                    }}
                                    title={`打开: ${att.name}`}
                                  >
                                    {att.name || "打开"}
                                  </Button>
                                )}
                                <span className="text-muted-foreground text-xs">|</span>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-6 text-xs p-0 text-blue-600"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/download/${encodeURIComponent(att.key)}`);
                                      if (!response.ok) throw new Error("下载失败");
                                      const blob = await response.blob();
                                      const blobUrl = window.URL.createObjectURL(blob);
                                      const link = document.createElement("a");
                                      link.href = blobUrl;
                                      link.download = att.name || "download";
                                      link.click();
                                      window.URL.revokeObjectURL(blobUrl);
                                    } catch {
                                      if (att.url) window.open(att.url, "_blank");
                                    }
                                  }}
                                >
                                  下载
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">无</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(task)}>
                          编辑
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingTaskId(task.id)}
                        >
                          删除
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                        >
                          <Lightbulb className="h-3.5 w-3.5" />
                          脑图
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* 头脑风暴展开行 */}
                  {expandedTaskId === task.id && (
                    <TableRow key={`${task.id}-brainstorm`}>
                      <TableCell colSpan={11} className="bg-amber-50/50 p-4">
                        <TaskBrainstorm
                          taskId={task.id}
                          currentUser={currentUser}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* 编辑表单 */}
      <TaskForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSubmit={handleEditSubmit}
        initialData={editingTask || undefined}
        mode="edit"
        taskId={editingTask?.id}
        onAttachmentsChange={async (taskId, attachments) => {
          await onUpdate(taskId, { attachments } as any);
        }}
      />

      {/* 删除确认 */}
      <AlertDialog open={deletingTaskId !== null} onOpenChange={() => setDeletingTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个任务吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
