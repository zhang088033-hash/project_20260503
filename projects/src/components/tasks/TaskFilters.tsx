'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MODULE_OPTIONS, PRIORITY_OPTIONS } from '@/types/task';

// 责任人选项
const RESPONSIBLE_PERSON_OPTIONS = [
  '市场部', '新媒体部', '运营部', '商务部', '招商部', '设计部', 'IT部'
];

interface TaskFiltersProps {
  filters: {
    module?: string;
    priority?: string;
    status?: string;
    responsible_person?: string;
  };
  onFiltersChange: (filters: { module?: string; priority?: string; status?: string; responsible_person?: string }) => void;
  onQuickFilter: (type: 'today' | 'overdue' | 'all') => void;
  quickFilter: 'today' | 'overdue' | 'all';
}

export function TaskFilters({ filters, onFiltersChange, onQuickFilter, quickFilter }: TaskFiltersProps) {
  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasFilters = filters.module || filters.priority || filters.status || filters.responsible_person;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        {/* 快捷筛选 */}
        <div className="flex gap-2">
          <Button 
            variant={quickFilter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onQuickFilter('all')}
          >
            全部
          </Button>
          <Button 
            variant={quickFilter === 'today' ? 'default' : 'outline'} 
            size="sm"
            className={quickFilter === 'today' ? 'bg-blue-600' : ''}
            onClick={() => onQuickFilter('today')}
          >
            今日待办
          </Button>
          <Button 
            variant={quickFilter === 'overdue' ? 'default' : 'outline'} 
            size="sm"
            className={quickFilter === 'overdue' ? 'bg-red-600' : ''}
            onClick={() => onQuickFilter('overdue')}
          >
            逾期预警
          </Button>
        </div>

        {/* 高级筛选 */}
        <div className="flex gap-2 flex-wrap">
          <Select
            value={filters.module || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, module: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="模块" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部模块</SelectItem>
              {MODULE_OPTIONS.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, priority: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部优先级</SelectItem>
              {PRIORITY_OPTIONS.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待处理</SelectItem>
              <SelectItem value="in_progress">进行中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.responsible_person || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, responsible_person: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="责任人" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部责任人</SelectItem>
              {RESPONSIBLE_PERSON_OPTIONS.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              清除筛选
            </Button>
          )}
        </div>
      </div>

      {/* 当前筛选标签 */}
      {hasFilters && (
        <div className="flex gap-2 flex-wrap">
          {filters.module && (
            <Badge variant="secondary" className="gap-1">
              模块: {filters.module}
              <button 
                className="ml-1 hover:text-red-600" 
                onClick={() => onFiltersChange({ ...filters, module: undefined })}
              >
                ×
              </button>
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="secondary" className="gap-1">
              优先级: {filters.priority}
              <button 
                className="ml-1 hover:text-red-600" 
                onClick={() => onFiltersChange({ ...filters, priority: undefined })}
              >
                ×
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              状态: {filters.status === 'pending' ? '待处理' : filters.status === 'in_progress' ? '进行中' : '已完成'}
              <button 
                className="ml-1 hover:text-red-600" 
                onClick={() => onFiltersChange({ ...filters, status: undefined })}
              >
                ×
              </button>
            </Badge>
          )}
          {filters.responsible_person && (
            <Badge variant="secondary" className="gap-1">
              责任人: {filters.responsible_person}
              <button 
                className="ml-1 hover:text-red-600" 
                onClick={() => onFiltersChange({ ...filters, responsible_person: undefined })}
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
