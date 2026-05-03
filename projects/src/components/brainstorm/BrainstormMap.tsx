'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Trash2, MessageCircle, Send, ChevronDown, ChevronUp, User } from 'lucide-react';

interface BrainstormItem {
  id: number;
  username: string;
  content: string;
  parent_id: number | null;
  task_id: number;
  created_at: string;
}

interface TaskBrainstormProps {
  taskId: number;
  currentUser: { id: number; username: string };
  compact?: boolean;
}

const USER_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  { bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500' },
  { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
];

function getUserColor(username: string, colorMap: Record<string, number>) {
  return USER_COLORS[colorMap[username] ?? 0];
}

export function TaskBrainstorm({ taskId, currentUser, compact = false }: TaskBrainstormProps) {
  const [items, setItems] = useState<BrainstormItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userColorMap, setUserColorMap] = useState<Record<string, number>>({});

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/brainstorms?task_id=${taskId}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
        // 分配颜色
        const userSet = new Set<string>();
        json.data.forEach((item: BrainstormItem) => userSet.add(item.username));
        const map: Record<string, number> = {};
        let idx = 0;
        userSet.forEach(u => {
          map[u] = idx % USER_COLORS.length;
          idx++;
        });
        setUserColorMap(map);
      }
    } catch (err) {
      console.error('获取讨论失败:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSubmit = async () => {
    if (!newContent.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/brainstorms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newContent, task_id: taskId }),
      });
      const json = await res.json();
      if (json.success) {
        setNewContent('');
        fetchItems();
      }
    } catch (err) {
      console.error('发表意见失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !replyToId) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/brainstorms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: replyContent,
          task_id: taskId,
          parent_id: replyToId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReplyContent('');
        setReplyToId(null);
        fetchItems();
      }
    } catch (err) {
      console.error('回复失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/brainstorms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        fetchItems();
      }
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  // 统计参与人数
  const participants = new Set(items.map(i => i.username));
  const topLevelItems = items.filter(i => !i.parent_id);

  // 紧凑模式 - 在表格行中显示
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          <Lightbulb className="h-3.5 w-3.5" />
          <span>{items.length}</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        {items.length > 0 && (
          <div className="flex -space-x-1.5">
            {Array.from(participants).slice(0, 5).map(username => {
              const color = getUserColor(username, userColorMap);
              return (
                <div
                  key={username}
                  className={`w-5 h-5 rounded-full ${color.dot} flex items-center justify-center text-white text-[8px] font-bold border-2 border-white`}
                  title={username}
                >
                  {username.charAt(0).toUpperCase()}
                </div>
              );
            })}
            {participants.size > 5 && (
              <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-[8px] font-bold border-2 border-white">
                +{participants.size - 5}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 完整展开模式
  return (
    <div className="space-y-3">
      {/* 标题栏 - 可折叠 */}
      <button
        className="flex items-center gap-2 w-full text-left group"
        onClick={() => setExpanded(!expanded)}
      >
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium">头脑风暴</span>
        <Badge variant="secondary" className="text-[10px] h-5">
          {items.length} 条意见 · {participants.size} 人参与
        </Badge>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 pl-2 border-l-2 border-amber-200">
          {loading ? (
            <div className="text-xs text-muted-foreground py-2">加载中...</div>
          ) : (
            <>
              {/* 发表意见 */}
              <div className="flex gap-2">
                <div className={`w-7 h-7 rounded-full ${getUserColor(currentUser.username, userColorMap).dot} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5`}>
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="发表你的想法、建议或意见..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={2}
                    className="text-sm resize-none"
                  />
                  <Button
                    size="sm"
                    className="h-auto self-end gap-1"
                    onClick={handleSubmit}
                    disabled={!newContent.trim() || submitting}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {submitting ? '...' : '发表'}
                  </Button>
                </div>
              </div>

              {/* 意见列表 */}
              {topLevelItems.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">还没有人发表意见，来写下第一条吧</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topLevelItems.map(item => {
                    const color = getUserColor(item.username, userColorMap);
                    const replies = items.filter(i => i.parent_id === item.id);
                    return (
                      <div key={item.id} className="space-y-2">
                        {/* 主意见 */}
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="flex items-start gap-2">
                            <div className={`w-7 h-7 rounded-full ${color.dot} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                              {item.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm font-medium ${color.text}`}>{item.username}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(item.created_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">{item.content}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                                  onClick={() => setReplyToId(replyToId === item.id ? null : item.id)}
                                >
                                  <MessageCircle className="h-3 w-3" />
                                  回复
                                  {replies.length > 0 && ` (${replies.length})`}
                                </Button>
                                {item.username === currentUser.username && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[11px] gap-1 text-red-400 hover:text-red-600"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    删除
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 回复列表 */}
                        {replies.length > 0 && (
                          <div className="ml-6 space-y-2 border-l-2 border-gray-100 pl-3">
                            {replies.map(reply => {
                              const replyColor = getUserColor(reply.username, userColorMap);
                              return (
                                <div key={reply.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                                  <div className="flex items-start gap-2">
                                    <div className={`w-5 h-5 rounded-full ${replyColor.dot} flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0`}>
                                      {reply.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-xs font-medium ${replyColor.text}`}>{reply.username}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {new Date(reply.created_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className="text-xs leading-relaxed">{reply.content}</p>
                                      {reply.username === currentUser.username && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 text-[10px] gap-0.5 text-red-400 hover:text-red-600 mt-1"
                                          onClick={() => handleDelete(reply.id)}
                                        >
                                          <Trash2 className="h-2.5 w-2.5" />
                                          删除
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* 回复输入框 */}
                        {replyToId === item.id && (
                          <div className="ml-6 flex gap-2">
                            <div className={`w-5 h-5 rounded-full ${getUserColor(currentUser.username, userColorMap).dot} flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0 mt-1`}>
                              {currentUser.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 flex gap-2">
                              <Textarea
                                placeholder={`回复 ${item.username}...`}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                rows={2}
                                className="text-xs resize-none"
                              />
                              <div className="flex flex-col gap-1 self-end">
                                <Button
                                  size="sm"
                                  className="h-7 gap-1 text-xs"
                                  onClick={handleReply}
                                  disabled={!replyContent.trim() || submitting}
                                >
                                  <Send className="h-3 w-3" />
                                  {submitting ? '...' : '回复'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => { setReplyToId(null); setReplyContent(''); }}
                                >
                                  取消
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
