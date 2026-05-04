'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, XCircle, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CozeSettingsPage() {
  const [cozeBotCode, setCozeBotCode] = useState('');
  const [enableFloatingWidget, setEnableFloatingWidget] = useState(false);
  const [saved, setSaved] = useState(false);
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedBotCode = localStorage.getItem('coze_bot_code') || '';
    const savedEnableWidget = localStorage.getItem('coze_enable_widget') === 'true';
    setCozeBotCode(savedBotCode);
    setEnableFloatingWidget(savedEnableWidget);
  }, []);

  const handleSave = () => {
    localStorage.setItem('coze_bot_code', cozeBotCode);
    localStorage.setItem('coze_enable_widget', String(enableFloatingWidget));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    if (!cozeBotCode) return;
    setChecking(true);
    
    const popup = window.open(
      `https://www.coze.cn/store/bot/${cozeBotCode}/chat`,
      '_blank',
      'width=800,height=600'
    );
    
    setTimeout(() => setChecking(false), 2000);
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
              <h1 className="text-2xl font-bold text-gray-900">Coze 配置</h1>
              <p className="text-sm text-muted-foreground">设置 Coze 悬浮窗聊天机器人</p>
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
                Coze 悬浮窗设置
              </CardTitle>
              <CardDescription>
                配置 Coze 聊天机器人悬浮窗，让访客可以实时与 AI 对话
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="botCode">机器人 Code</Label>
                <div className="flex gap-3">
                  <Input
                    id="botCode"
                    placeholder="例如：7285123456789012345"
                    value={cozeBotCode}
                    onChange={(e) => setCozeBotCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleTest}
                    disabled={!cozeBotCode || checking}
                  >
                    {checking ? '检查中...' : '测试'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  在 Coze 后台 → 你的机器人 → 右上角「···」→「复制 Bot Code」
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用悬浮窗</Label>
                  <p className="text-sm text-muted-foreground">
                    在网站右下角显示聊天按钮，访客可以点击与 AI 对话
                  </p>
                </div>
                <Switch
                  checked={enableFloatingWidget}
                  onCheckedChange={setEnableFloatingWidget}
                />
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={handleSave}
                  className="w-full"
                  disabled={!cozeBotCode}
                >
                  {saved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      已保存
                    </>
                  ) : (
                    '保存设置'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>如何获取 Bot Code？</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">登录 Coze 中国版</p>
                    <p className="text-sm text-muted-foreground">访问 https://www.coze.cn 并登录</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">打开你的机器人</p>
                    <p className="text-sm text-muted-foreground">在「我的应用」或「商店」中找到你的机器人</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">复制 Bot Code</p>
                    <p className="text-sm text-muted-foreground">点击机器人右上角的「···」菜单，选择「复制 Bot Code」</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">粘贴并保存</p>
                    <p className="text-sm text-muted-foreground">将 Bot Code 粘贴到上方输入框并保存</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-800">💡 提示</CardTitle>
            </CardHeader>
            <CardContent className="text-amber-700">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>确保你的机器人已经发布到「网页嵌入」渠道</li>
                <li>悬浮窗会在网站所有页面右下角显示</li>
                <li>访客可以直接与你的 Coze 机器人对话</li>
                <li>AI Editor（专业创作后台）和悬浮窗可以同时使用</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
