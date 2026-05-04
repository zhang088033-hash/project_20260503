'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Send, Plus, Bot, User, Copy, CheckCircle2 } from 'lucide-react';
import { AgentSelector } from '@/components/ai-editor/AgentSelector';
import { AI_AGENTS, AIAgent } from '@/lib/ai-agents';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, FileText, Share2, Target } from 'lucide-react';

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
  const [selectedAgent, setSelectedAgent] = useState<AIAgent>(AI_AGENTS[0]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
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
        body: JSON.stringify({ title: `${selectedAgent.name} - 新对话` })
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
      content_type: selectedAgent.id,
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
          agent_id: selectedAgent.id
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

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'brainstorm':
        return <Lightbulb className="h-4 w-4" />;
      case 'scriptwriter':
        return <FileText className="h-4 w-4" />;
      case 'postcreator':
        return <Share2 className="h-4 w-4" />;
      case 'strategist':
        return <Target className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const quickPrompts = selectedAgent.examplePrompts;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-64 flex-shrink-0">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
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
                      <div className="flex items-center gap-2">
                        {getAgentIcon(session.title.split(' - ')[0] || 'brainstorm')}
                        <span className="font-medium truncate">{session.title}</span>
                      </div>
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
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  AI Editor
                </CardTitle>
                <Badge variant="outline" className={selectedAgent.color}>
                  {selectedAgent.icon} {selectedAgent.name}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAgentSelector(!showAgentSelector)}
                className="gap-2"
              >
                切换助手
              </Button>
            </div>
          </CardHeader>
          
          {showAgentSelector && (
            <div className="p-4 border-b bg-gray-50">
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
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <div className={`p-4 rounded-full ${selectedAgent.color} mb-4`}>
                    {getAgentIcon(selectedAgent.id)}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">欢迎使用 {selectedAgent.name}！</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {selectedAgent.description}
                  </p>
                  
                  <div className="space-y-3 w-full max-w-lg">
                    <div className="text-sm text-muted-foreground text-left mb-2">试试这样问：</div>
                    {quickPrompts.map((prompt, idx) => (
                      <Button 
                        key={idx}
                        variant="outline" 
                        onClick={() => setInputContent(prompt)}
                        className="h-auto py-3 text-left w-full justify-start"
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
                            <span className="text-xs font-medium text-purple-600">
                              {AI_AGENTS.find(a => a.id === msg.content_type)?.name || 'AI'}
                            </span>
                          )}
                          {msg.role === 'user' && (
                            <span className="text-xs font-medium text-blue-600">你</span>
                          )}
                        </div>
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
                      <Avatar className="h-8 w-8 bg-purple-600 flex-shrink-0 flex items-center justify-center">
                        {getAgentIcon(selectedAgent.id)}
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
