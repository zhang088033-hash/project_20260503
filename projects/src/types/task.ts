export type Priority = 'P0' | 'P1' | 'P2';

export type Status = 'pending' | 'in_progress' | 'completed';

export type Module = 
  | '推广模块' 
  | '达人对接模块' 
  | '物料模块' 
  | '场地搭建模块' 
  | '招商政策模块' 
  | '品牌合作模块' 
  | '活动策划模块' 
  | '其他';

export interface TaskAttachment {
  id: string;
  name: string;
  key: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: Priority;
  module: Module;
  deadline?: string;
  deliverables?: string;
  responsible_person?: string;
  status: Status;
  attachments?: TaskAttachment[];
  remark?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: Priority;
  module: Module;
  deadline?: string;
  deliverables?: string;
  responsible_person?: string;
  remark?: string;
}

export const MODULE_OPTIONS: Module[] = [
  '推广模块',
  '达人对接模块',
  '物料模块',
  '场地搭建模块',
  '招商政策模块',
  '品牌合作模块',
  '活动策划模块',
  '其他'
];

export const PRIORITY_OPTIONS: Priority[] = ['P0', 'P1', 'P2'];

export const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: 'pending', label: '待处理', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-800' }
];

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string }> = {
  'P0': { label: '核心必做', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  'P1': { label: '重要补充', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  'P2': { label: '优化迭代', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' }
};
