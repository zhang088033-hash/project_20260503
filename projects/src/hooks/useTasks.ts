'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskFormData } from '@/types/task';

const API_BASE = '/api/tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (filters?: {
    module?: string;
    priority?: string;
    status?: string;
    responsible_person?: string;
    today?: boolean;
    overdue?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.module) params.append('module', filters.module);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.responsible_person) params.append('responsible_person', filters.responsible_person);
      if (filters?.today) params.append('today', 'true');
      if (filters?.overdue) params.append('overdue', 'true');

      const url = params.toString() ? `${API_BASE}?${params.toString()}` : API_BASE;
      const res = await fetch(url);
      const json = await res.json();

      if (!json.success) throw new Error(json.error);
      setTasks(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = async (data: TaskFormData): Promise<Task | null> => {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setTasks(prev => [...prev, json.data]);
      return json.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败');
      return null;
    }
  };

  const updateTask = async (id: number, data: Partial<Task>): Promise<Task | null> => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setTasks(prev => prev.map(t => t.id === id ? json.data : t));
      return json.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新任务失败');
      return null;
    }
  };

  const deleteTask = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setTasks(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除任务失败');
      return false;
    }
  };

  const updateTaskStatus = async (id: number, status: Task['status']): Promise<Task | null> => {
    return updateTask(id, { status });
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus
  };
}
