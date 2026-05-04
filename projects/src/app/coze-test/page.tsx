'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CozeTestPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const res = await fetch('/api/coze/test');
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '请求失败'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/')}>
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Coze 连接测试</h1>
              <p className="text-sm text-muted-foreground">测试 Coze API 是否正常连接</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                Coze API 测试
              </CardTitle>
              <CardDescription>
                点击按钮测试 Coze API 连接是否正常
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testConnection}
                disabled={testing}
                className="w-full"
                size="lg"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    测试中...
                  </>
                ) : (
                  '测试 Coze 连接'
                )}
              </Button>

              {result && (
                <div className={`p-4 rounded-lg ${
                  result.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.success ? '连接成功！' : '连接失败'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {result.baseUrl && (
                      <div className="flex gap-2">
                        <span className="text-gray-600">API 地址:</span>
                        <code className="bg-white px-2 py-1 rounded">{result.baseUrl}</code>
                      </div>
                    )}
                    
                    {result.botId && (
                      <div className="flex gap-2">
                        <span className="text-gray-600">Bot ID:</span>
                        <code className="bg-white px-2 py-1 rounded">{result.botId}</code>
                      </div>
                    )}
                    
                    {result.error && (
                      <div className="text-red-700">
                        <span className="font-medium">错误信息:</span>
                        <p className="mt-1">{result.error}</p>
                      </div>
                    )}
                    
                    {result.response && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-600">AI 回复:</span>
                        <p className="mt-1 bg-white p-3 rounded whitespace-pre-wrap">
                          {result.response}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-800">⚠️ 需要配置</CardTitle>
            </CardHeader>
            <CardContent className="text-amber-700 space-y-3">
              <p>在测试之前，请确保已在 Vercel 配置以下环境变量：</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <code className="bg-amber-100 px-2 py-1 rounded">COZE_API_KEY</code>
                  <span>✅ 你已提供</span>
                </div>
                <div className="flex gap-2">
                  <code className="bg-amber-100 px-2 py-1 rounded">COZE_BOT_ID</code>
                  <span className="text-red-600">❌ 未配置</span>
                </div>
                <div className="flex gap-2">
                  <code className="bg-amber-100 px-2 py-1 rounded">COZE_REGION</code>
                  <span>可选，默认 cn</span>
                </div>
              </div>
              <div className="pt-2">
                <p className="font-medium">如何获取 Bot ID？</p>
                <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
                  <li>登录 <a href="https://www.coze.cn" target="_blank" className="underline">Coze 中国版</a></li>
                  <li>打开你的机器人</li>
                  <li>点击右上角「···」→「复制 Bot Code」</li>
                  <li>在 Vercel 环境变量中添加 <code className="bg-amber-100 px-1">COZE_BOT_ID</code></li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>下一步</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">配置 COZE_BOT_ID</p>
                    <p className="text-sm text-muted-foreground">在 Vercel 环境变量中添加</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">重新部署</p>
                    <p className="text-sm text-muted-foreground">让环境变量生效</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">测试连接</p>
                    <p className="text-sm text-muted-foreground">点击上方按钮测试</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
