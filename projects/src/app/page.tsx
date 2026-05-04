'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskTable } from '@/components/tasks/TaskTable';
import { TaskStats } from '@/components/tasks/TaskStats';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, ListTodo, AlertTriangle, LayoutGrid, Database, Loader2, Users, LogOut, Sparkles, Settings } from 'lucide-react';
import AuthForm from '@/components/AuthForm';
import { CozeFloatingWidget } from '@/components/CozeFloatingWidget';
import type { TaskFormData, Status, Task } from '@/types/task';
import { useRouter } from 'next/navigation';

// 责任人配置
const RESPONSIBLE_PERSONS = [
  { key: '市场部', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { key: '新媒体部', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { key: '运营部', color: 'bg-green-100 text-green-800 border-green-200' },
  { key: '商务部', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { key: '招商部', color: 'bg-red-100 text-red-800 border-red-200' },
  { key: '设计部', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { key: 'IT部', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
];

type QuickFilter = 'today' | 'overdue' | 'all';

export default function TasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { tasks, loading, error, fetchTasks, createTask, updateTask, deleteTask, updateTaskStatus } = useTasks();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [advancedFilters, setAdvancedFilters] = useState<{
    module?: string;
    priority?: string;
    status?: string;
    responsible_person?: string;
  }>({});

  const [currentView, setCurrentView] = useState<'all' | 'today' | 'overdue'>('all');
  const [initializing, setInitializing] = useState(false);
  const [initMessage, setInitMessage] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          setUser({ id: data.data.userId, username: data.data.username });
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // 根据筛选条件获取任务
  useEffect(() => {
    if (!user) return;
    if (quickFilter === 'all') {
      fetchTasks(advancedFilters);
    } else if (quickFilter === 'today') {
      fetchTasks({ ...advancedFilters, today: true });
    } else if (quickFilter === 'overdue') {
      fetchTasks({ ...advancedFilters, overdue: true });
    }
  }, [quickFilter, advancedFilters, fetchTasks, user]);

  // 检查是否有预设数据
  useEffect(() => {
    if (!user) return;
    checkInitStatus();
  }, [user]);

  // 按责任人统计任务数
  const responsiblePersonStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; pending: number }> = {};
    RESPONSIBLE_PERSONS.forEach(rp => {
      stats[rp.key] = { total: 0, completed: 0, pending: 0 };
    });
    
    tasks.forEach(t => {
      const person = t.responsible_person || '未分配';
      if (!stats[person]) {
        stats[person] = { total: 0, completed: 0, pending: 0 };
      }
      stats[person].total++;
      if (t.status === 'completed') {
        stats[person].completed++;
      } else if (t.status === 'pending') {
        stats[person].pending++;
      }
    });
    return stats;
  }, [tasks]);

  const handleLogin = (token: string, userData: { id: number; username: string }) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const checkInitStatus = async () => {
    try {
      const res = await fetch('/api/tasks/init');
      const json = await res.json();
      if (json.success) {
        setHasData(json.hasData);
      }
    } catch (err) {
      console.error('检查初始化状态失败:', err);
    }
  };

  const handleQuickFilter = (type: QuickFilter) => {
    setQuickFilter(type);
    setCurrentView(type);
  };

  const handleCreateTask = async (data: TaskFormData) => {
    await createTask(data);
    if (quickFilter === 'all') {
      fetchTasks(advancedFilters);
    } else if (quickFilter === 'today') {
      fetchTasks({ ...advancedFilters, today: true });
    } else if (quickFilter === 'overdue') {
      fetchTasks({ ...advancedFilters, overdue: true });
    }
  };

  const handleUpdateStatus = async (id: number, status: Status) => {
    const result = await updateTaskStatus(id, status);
    if (result) {
      if (quickFilter === 'all') {
        fetchTasks(advancedFilters);
      } else if (quickFilter === 'today') {
        fetchTasks({ ...advancedFilters, today: true });
      } else if (quickFilter === 'overdue') {
        fetchTasks({ ...advancedFilters, overdue: true });
      }
    }
    return result;
  };

  const handleUpdateTask = async (id: number, data: Partial<Task>) => {
    const result = await updateTask(id, data);
    if (result) {
      if (quickFilter === 'all') {
        fetchTasks(advancedFilters);
      } else if (quickFilter === 'today') {
        fetchTasks({ ...advancedFilters, today: true });
      } else if (quickFilter === 'overdue') {
        fetchTasks({ ...advancedFilters, overdue: true });
      }
    }
    return result;
  };

  const handleDeleteTask = async (id: number) => {
    const result = await deleteTask(id);
    if (result) {
      if (quickFilter === 'all') {
        fetchTasks(advancedFilters);
      } else if (quickFilter === 'today') {
        fetchTasks({ ...advancedFilters, today: true });
      } else if (quickFilter === 'overdue') {
        fetchTasks({ ...advancedFilters, overdue: true });
      }
    }
    return result;
  };

  const handleInitialize = async () => {
    setInitializing(true);
    setInitMessage(null);
    try {
      const res = await fetch('/api/tasks/init', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setInitMessage(`成功初始化 ${json.count} 个预设任务`);
        setHasData(true);
        fetchTasks({});
      } else {
        setInitMessage(`初始化失败: ${json.error}`);
      }
    } catch {
      setInitMessage('初始化失败，请重试');
    } finally {
      setInitializing(false);
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'today': return '今日待办';
      case 'overdue': return '逾期预警';
      default: return '全周期任务总表';
    }
  };

  // 认证加载中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 未登录时显示登录页面
  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">圳铺-罗湖星宠汇招商任务管理</h1>
              <p className="text-sm text-muted-foreground mt-1">
                项目周期：2026年5月1日招商启动 - 持续3个月（至7月31日）
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground hidden sm:inline">欢迎，{user.username}</span>
              <Button 
                onClick={() => router.push('/ai-editor')} 
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="h-4 w-4" />
                AI Editor
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/coze-settings')} 
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Coze</span>
              </Button>
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                新增任务
              </Button>
              {!hasData && (
                <Button 
                  variant="outline" 
                  onClick={handleInitialize} 
                  disabled={initializing}
                  className="gap-2"
                >
                  {initializing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  {initializing ? '初始化中...' : '加载预设任务'}
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">退出</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="space-y-6">
        {/* 统计卡片 */}
        <TaskStats tasks={tasks} />

        {/* 按责任人分类统计 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              按责任人分类
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {RESPONSIBLE_PERSONS.map(rp => {
                const stats = responsiblePersonStats[rp.key] || { total: 0, completed: 0, pending: 0 };
                const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                const isSelected = advancedFilters.responsible_person === rp.key;
                return (
                  <div 
                    key={rp.key}
                    className={`rounded-lg border-2 p-3 cursor-pointer transition-all hover:scale-105 ${rp.color} ${isSelected ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => {
                      if (stats.total > 0) {
                        setAdvancedFilters({
                          ...advancedFilters,
                          responsible_person: isSelected ? undefined : rp.key
                        });
                      }
                    }}
                  >
                    <div className="text-sm font-medium mb-1">{rp.key}</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs mt-1 opacity-80">
                      已完成 {stats.completed} | 进行中 {stats.total - stats.completed - stats.pending}
                    </div>
                    {stats.total > 0 && (
                      <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-current opacity-70 rounded-full transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    )}
                    {isSelected && (
                      <div className="mt-2 text-xs text-center text-primary font-medium">
                        已筛选
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 视图切换和筛选 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {currentView === 'today' && <ListTodo className="h-5 w-5 text-blue-600" />}
                {currentView === 'overdue' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                {currentView === 'all' && <LayoutGrid className="h-5 w-5 text-gray-600" />}
                {getViewTitle()}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                共 {tasks.length} 个任务
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <TaskFilters
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              onQuickFilter={handleQuickFilter}
              quickFilter={quickFilter}
            />
          </CardContent>
        </Card>

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 初始化消息 */}
        {initMessage && (
          <Alert variant={initMessage.includes('成功') ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{initMessage}</AlertDescription>
          </Alert>
        )}

        {/* 任务列表 */}
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <TaskTable
                tasks={tasks}
                onUpdateStatus={handleUpdateStatus}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
                currentUser={user}
              />
            )}
          </CardContent>
        </Card>

        {/* 逾期任务提醒 */}
        {quickFilter !== 'overdue' && tasks.filter(t => {
          if (!t.deadline || t.status === 'completed') return false;
          return new Date(t.deadline) < new Date();
        }).length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              当前有 {tasks.filter(t => {
                if (!t.deadline || t.status === 'completed') return false;
                return new Date(t.deadline) < new Date();
              }).length} 个逾期任务，请及时处理
            </AlertDescription>
          </Alert>
        )}
        </div>
      </main>

      {/* 新建任务表单 */}
      <TaskForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreateTask}
        mode="create"
      />

      {/* Coze 悬浮窗 */}
      <CozeFloatingWidget />
    </div>
  );
}
