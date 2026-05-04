'use client';

import { AI_MODELS, AIModelConfig } from '@/lib/ai-models';
import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: AIModelConfig;
  onSelectModel: (model: AIModelConfig) => void;
}

export function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="h-5 w-5 text-blue-600" />
        <span className="font-medium">选择 AI 模型</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {AI_MODELS.map((model) => (
          <Card
            key={model.id}
            className={`cursor-pointer transition-all hover:scale-[1.02] ${
              selectedModel.id === model.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectModel(model)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{model.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{model.name}</div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {model.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800">
          💡 <strong>提示：</strong>要使用真实的 AI 模型，请在 Vercel 环境变量中配置相应的 API Key：
          <br />
          <code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code>、 
          <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code>、 
          <code className="bg-amber-100 px-1 rounded">GOOGLE_API_KEY</code> 或 
          <code className="bg-amber-100 px-1 rounded">COZE_API_KEY</code>
        </p>
      </div>
    </div>
  );
}
