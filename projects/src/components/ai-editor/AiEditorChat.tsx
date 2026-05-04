'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Sparkles, MessageSquare, Plus, Bot, User, Copy, CheckCircle2 } from 'lucide-react';

interface Message {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  content_type: string;
  created_at: string;
}

interface Session {
  id: number;
  user_id: number;
  username: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface AiEditorChatProps {
  token: string;
}

export function AiEditorChat({ token }: AiEditorChatProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [contentType, setContentType] = useState<'text' | 'idea' | 'script' | 'post'>('text');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, [token]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      setSessionLoading(true);
      const res = await fetch('/api/ai-editor/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
        if (data.data.length > 0 && !currentSessionId) {
          setCurrentSessionId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Load sessions error:', error);
    } finally {
      setSessionLoading(false);
    }
  };

  const loadMessages = async (sessionId: number) => {
    try {
      const res = await fetch(`/api/ai-editor/sessions/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const createSession = async () => {
    try {
      const res = await fetch('/api/ai-editor/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: '新对话' })
      });
      const data = await res.json();
      if (data.success) {
        setSessions([data.data, ...sessions]);
        setCurrentSessionId(data.data.id);
        setMessages([]);
      }
    } catch (error) {
      console.error('Create session error:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputContent.trim() || !currentSessionId || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      session_id: currentSessionId,
      role: 'user',
      content: inputContent.trim(),
      content_type: contentType,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputContent('');
    setLoading(true);

    try {
      const res = await fetch(`/api/ai-editor/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: inputContent.trim(),
          content_type: contentType
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        loadSessions();
      }
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyContent = async (content: string, id: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const quickPrompt = (prompt: string) => {
    setInputContent(prompt);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-64 flex-shrink-0">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                对话
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={createSession}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-1 p-2">
                {sessionLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">加载中...</div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    还没有对话，点击 + 开始新对话
                  </div>
                ) : (
                  sessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => setCurrentSessionId(session.id)}
                      className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                        currentSessionId === session.id
                          ? 'bg-purple-100 text-purple-900'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium truncate">{session.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(session.updated_at || session.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                AI Editor
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <Bot className="h-16 w-16 text-purple-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">欢迎来到 AI Editor！</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    我是你的新媒体创作助手，可以帮你 brainstorm 创意、写脚本、生成帖子内容。
                    试试下面的快速开始，或者直接和我聊天吧！
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                    <Button 
                      variant="outline" 
                      onClick={() => quickPrompt('帮我想一个宠物视频创意')}
                      className="h-auto py-3 text-left"
                    >
                      <div>
                        <div className="font-medium">💡 创意灵感</div>
                        <div className="text-xs text-muted-foreground">宠物视频方向</div>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => quickPrompt('写一个关于 Namaste 的脚本')}
                      className="h-auto py-3 text-left"
                    >
                      <div>
                        <div className="font-medium">📝 脚本撰写</div>
                        <div className="text-xs text-muted-foreground">Namaste 主题</div>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => quickPrompt('帮我生成一篇社交媒体帖子')}
                      className="h-auto py-3 text-left"
                    >
                      <div>
                        <div className="font-medium">✨ 帖子创作</div>
                        <div className="text-xs text-muted-foreground">社交平台内容</div>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => quickPrompt('聊聊新媒体内容创作的趋势')}
                      className="h-auto py-3 text-left"
                    >
                      <div>
                        <div className="font-medium">🎯 话题讨论</div>
                        <div className="text-xs text-muted-foreground">行业趋势分析</div>
                      </div>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <Avatar className="h-8 w-8 bg-purple-600 flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </Avatar>
                      )}
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className={`rounded-2xl px-4 py-3 whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {msg.content}
                        </div>
                        {msg.role === 'assistant' && (
                          <div className="mt-2 flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => copyContent(msg.content, msg.id)}
                            >
                              {copiedId === msg.id ? (
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 mr-1" />
                              )}
                              {copiedId === msg.id ? '已复制' : '复制'}
                            </Button>
                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <Avatar className="h-8 w-8 bg-blue-600 flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 bg-purple-600 flex-shrink-0">
                        <Bot className="h-4 w-4 text-white animate-pulse" />
                      </Avatar>
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t">
              <Tabs value={contentType} onValueChange={(v) => setContentType(v as any)} className="mb-3">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="text">对话</TabsTrigger>
                  <TabsTrigger value="idea">创意</TabsTrigger>
                  <TabsTrigger value="script">脚本</TabsTrigger>
                  <TabsTrigger value="post">帖子</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex gap-3">
                <Textarea
                  placeholder="输入你的想法，让 AI 帮你创作..."
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 resize-none"
                  rows={2}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={loading || !inputContent.trim() || !currentSessionId}
                  className="self-end bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
