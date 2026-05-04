'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Send, Plus, Bot, User, Copy, CheckCircle2, Settings } from 'lucide-react';
import { AgentSelector } from '@/components/ai-editor/AgentSelector';
import { ModelSelector } from '@/components/ai-editor/ModelSelector';
import { AI_AGENTS, AIAgent, getDefaultAgent } from '@/lib/ai-agents';
import { AI_MODELS, AIModelConfig, getDefaultModel } from '@/lib/ai-models';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, FileText, Share2, Target, Palette } from 'lucide-react';

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

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function AiEditorChat({ token }: AiEditorChatProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent>(getDefaultAgent());
  const [selectedModel, setSelectedModel] = useState<AIModelConfig>(getDefaultModel());
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
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
      const res = await fetchWithTimeout('/api/ai-editor/sessions', {
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
      const res = await fetchWithTimeout(`/api/ai-editor/sessions/${sessionId}/messages`, {
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
      const res = await fetchWithTimeout('/api/ai-editor/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: `${selectedAgent.name} - 新对话` })
      }, 15000);
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
    console.log('sendMessage called', { inputContent: inputContent.trim(), loading, currentSessionId, selectedModel });
    if (!inputContent.trim() || loading) {
      console.log('sendMessage blocked: empty or loading');
      return;
    }

    setLoading(true);

    const trimmedInput = inputContent.trim();
    const optimisticMessageId = Date.now();

    try {
      let sessionId = currentSessionId;
      if (!sessionId) {
        console.log('Creating new session...');
        const sessionRes = await fetchWithTimeout('/api/ai-editor/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: `${selectedAgent.name} - 新对话` })
        }, 15000);

        const sessionData = await sessionRes.json();
        console.log('Session created:', sessionData);
        if (!sessionData.success || !sessionData.data) {
          throw new Error(sessionData.error || '创建会话失败');
        }
        sessionId = sessionData.data.id;
        setCurrentSessionId(sessionId);
        setSessions(prev => [sessionData.data, ...prev]);
      }

      const userMessage: Message = {
        id: optimisticMessageId,
        session_id: sessionId as number,
        role: 'user',
        content: trimmedInput,
        content_type: selectedAgent.id,
        created_at: new Date().toISOString()
      };

      console.log('Adding user message to UI:', userMessage);
      setMessages(prev => [...prev, userMessage]);
      setInputContent('');

      console.log('Sending message to API...', { sessionId, agent: selectedAgent.id, model: selectedModel.id });
      const res = await fetchWithTimeout(`/api/ai-editor/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: trimmedInput,
          agent_id: selectedAgent.id,
          model_id: selectedModel.id
        })
      }, 45000);

      const data = await res.json();
      console.log('API response:', data);
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        loadSessions();
      } else {
        throw new Error(data.error || '未知错误');
      }
    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage = error instanceof Error ? error.message : '发送失败，请检查网络连接';
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessageId));
      alert(`发送失败：${errorMessage}`);
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

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'brainstorm':
        return <Lightbulb className="h-4 w-4" />;
      case 'scriptwriter':
        return <FileText className="h-4 w-4" />;
      case 'postcreator':
        return <Share2 className="h-4 w-4" />;
      case 'sticker':
        return <Palette className="h-4 w-4" />;
      case 'strategist':
        return <Target className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const quickPrompts = selectedAgent.examplePrompts;

  return (
    <div className="ai-editor-shell flex h-[calc(100vh-8rem)] gap-4 rounded-2xl border border-white/10 p-3">
      <div className="w-72 flex-shrink-0">
        <Card className="h-full border-white/10 bg-black/35 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
                <Bot className="h-5 w-5 text-fuchsia-300" />
                会话档案
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={createSession}
                className="text-zinc-200 hover:bg-white/10 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-1 p-2">
                {sessionLoading ? (
                  <div className="p-4 text-center text-sm text-zinc-400">加载中...</div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-zinc-400">
                    还没有对话，点击 + 开始新对话
                  </div>
                ) : (
                  sessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => setCurrentSessionId(session.id)}
                      className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                        currentSessionId === session.id
                          ? 'bg-fuchsia-400/20 text-fuchsia-100 border border-fuchsia-300/40'
                          : 'text-zinc-200 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getAgentIcon(session.title.split(' - ')[0] || 'brainstorm')}
                        <span className="font-medium truncate">{session.title}</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">
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
        <Card className="flex-1 flex flex-col border-white/10 bg-black/30 backdrop-blur-xl">
          <CardHeader className="pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
                  <Bot className="h-5 w-5 text-fuchsia-300" />
                  创作助手中枢
                </CardTitle>
                <Badge variant="outline" className={`${selectedAgent.color} border-white/20`}>
                  {selectedAgent.icon} {selectedAgent.name}
                </Badge>
                <Badge variant="outline" className="bg-cyan-300/15 text-cyan-100 border-cyan-300/40">
                  {selectedModel.icon} {selectedModel.name}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowAgentSelector(!showAgentSelector);
                    setShowModelSelector(false);
                  }}
                  className="gap-2 border-white/20 bg-white/5 text-zinc-100 hover:bg-white/10"
                >
                  切换助手
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowModelSelector(!showModelSelector);
                    setShowAgentSelector(false);
                  }}
                  className="gap-2 border-white/20 bg-white/5 text-zinc-100 hover:bg-white/10"
                >
                  <Settings className="h-4 w-4" />
                  模型
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {showAgentSelector && (
            <div className="p-4 border-b border-white/10 bg-black/30">
              <AgentSelector 
                agents={AI_AGENTS}
                selectedAgent={selectedAgent}
                onSelectAgent={(agent) => {
                  setSelectedAgent(agent);
                  setShowAgentSelector(false);
                }}
              />
            </div>
          )}

          {showModelSelector && (
            <div className="p-4 border-b border-white/10 bg-black/30">
              <ModelSelector 
                selectedModel={selectedModel}
                onSelectModel={(model) => {
                  setSelectedModel(model);
                  setShowModelSelector(false);
                }}
              />
            </div>
          )}
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <div className={`p-4 rounded-full ${selectedAgent.color} mb-4 shadow-[0_0_30px_rgba(244,114,182,0.3)]`}>
                    {getAgentIcon(selectedAgent.id)}
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 text-zinc-100 tracking-wide">欢迎使用 {selectedAgent.name}</h3>
                  <p className="text-zinc-300 mb-2">
                    {selectedAgent.description}
                  </p>
                  <p className="text-sm text-cyan-200 mb-6">
                    当前模型：{selectedModel.icon} {selectedModel.name}
                  </p>
                  
                  <div className="space-y-3 w-full max-w-lg">
                    <div className="text-sm text-zinc-400 text-left mb-2 tracking-wide">试试这样问：</div>
                    {quickPrompts.map((prompt, idx) => (
                      <Button 
                        key={idx}
                        variant="outline" 
                        onClick={() => setInputContent(prompt)}
                        className="h-auto py-3 text-left w-full justify-start border-white/20 bg-white/5 text-zinc-100 hover:bg-white/12"
                      >
                        <span className="mr-2">{selectedAgent.icon}</span>
                        {prompt}
                      </Button>
                    ))}
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
                        <Avatar className="h-8 w-8 bg-purple-600 flex-shrink-0 flex items-center justify-center">
                          {getAgentIcon(msg.content_type)}
                        </Avatar>
                      )}
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {msg.role === 'assistant' && (
                            <span className="text-xs font-medium text-fuchsia-300">
                              {AI_AGENTS.find(a => a.id === msg.content_type)?.name || 'AI'}
                            </span>
                          )}
                          {msg.role === 'user' && (
                            <span className="text-xs font-medium text-cyan-300">你</span>
                          )}
                        </div>
                        <div className={`rounded-2xl px-4 py-3 whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/20'
                            : 'bg-white/10 text-zinc-100 border border-white/10'
                        }`}>
                          {msg.content}
                        </div>
                        {msg.role === 'assistant' && (
                          <div className="mt-2 flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs text-zinc-300 hover:text-white hover:bg-white/10"
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
                        <Avatar className="h-8 w-8 bg-cyan-500 flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 bg-fuchsia-600 flex-shrink-0 flex items-center justify-center">
                        {getAgentIcon(selectedAgent.id)}
                      </Avatar>
                      <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
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

            <div className="p-4 border-t border-white/10">
              <div className="flex gap-3">
                <Textarea
                  placeholder={`输入你的想法，让 ${selectedAgent.name} 帮你创作...`}
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 resize-none border-white/20 bg-white/5 text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-fuchsia-400/60"
                  rows={2}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={loading || !inputContent.trim()}
                  className="self-end bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-400 hover:to-violet-400 shadow-lg shadow-fuchsia-500/20"
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
      <style jsx>{`
        .ai-editor-shell {
          background:
            radial-gradient(circle at 12% 8%, rgba(244, 114, 182, 0.18), transparent 28%),
            radial-gradient(circle at 85% 20%, rgba(34, 211, 238, 0.16), transparent 30%),
            linear-gradient(160deg, #08080b 0%, #12121a 48%, #0b0c10 100%);
        }
      `}</style>
    </div>
  );
}
