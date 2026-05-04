export type AIModel = 'openai' | 'anthropic' | 'google' | 'coze' | 'siliconflow';

export interface AIModelConfig {
  id: AIModel;
  name: string;
  icon: string;
  description: string;
  maxTokens: number;
  temperature: number;
}

export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'openai',
    name: 'GPT-4',
    icon: '🤖',
    description: '最适合创意写作和对话',
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: 'anthropic',
    name: 'Claude',
    icon: '🧠',
    description: '最适合分析思考和长文本',
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: 'google',
    name: 'Gemini',
    icon: '✨',
    description: '最适合多模态内容',
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: 'coze',
    name: 'Coze',
    icon: '🔧',
    description: '最适合自动化工作流',
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    icon: '⚡',
    description: '支持多种大模型的聚合API',
    maxTokens: 4096,
    temperature: 0.7,
  },
];

export const getModelById = (id: AIModel): AIModelConfig | undefined => {
  return AI_MODELS.find(model => model.id === id);
};

export const getDefaultModel = (): AIModelConfig => {
  const cozeModel = AI_MODELS.find(m => m.id === 'coze');
  return cozeModel || AI_MODELS[0];
};
