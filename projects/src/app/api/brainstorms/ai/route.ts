import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { content, type } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ success: false, error: '内容不能为空' }, { status: 400 });
    }

    const aiResponses = generateAIResponse(content, type);

    return NextResponse.json({
      success: true,
      data: {
        responses: aiResponses,
        suggestions: generateSuggestions(content, type),
      }
    });
  } catch (error) {
    console.error('POST /api/brainstorms/ai error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'AI生成失败' },
      { status: 500 }
    );
  }
}

function getUserFromRequest(request: NextRequest): { id: number; username: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return { id: decoded.userId, username: decoded.username };
}

function generateAIResponse(content: string, type: string = 'general'): string[] {
  const responses: string[] = [];

  if (type === 'task') {
    responses.push(`针对「${content}」这个任务，我有以下建议：`);
    responses.push('1. 建议将任务拆分为更小的子任务，便于跟踪和管理');
    responses.push('2. 设置明确的里程碑和截止时间，确保进度可控');
    responses.push('3. 识别潜在的依赖关系，提前规划资源分配');
  } else if (type === 'idea') {
    responses.push(`关于「${content}」的想法，我有以下补充：`);
    responses.push('1. 这个方向很有潜力，建议进行可行性分析');
    responses.push('2. 可以考虑多角度思考，探索不同的实现路径');
    responses.push('3. 建议先做小规模验证，再逐步扩大范围');
  } else {
    responses.push(`针对您的想法「${content}」，我有一些建议：`);
    responses.push('1. 从用户需求角度出发思考解决方案');
    responses.push('2. 考虑技术实现的可能性和复杂性');
    responses.push('3. 评估风险和收益，制定相应的计划');
  }

  return responses;
}

function generateSuggestions(content: string, type: string = 'general'): string[] {
  const suggestions: string[] = [];

  if (type === 'task') {
    suggestions.push('添加子任务');
    suggestions.push('设置提醒');
    suggestions.push('分配责任人');
  } else if (type === 'idea') {
    suggestions.push('头脑风暴');
    suggestions.push('需求分析');
    suggestions.push('可行性评估');
  } else {
    suggestions.push('深入探讨');
    suggestions.push('整理思路');
    suggestions.push('制定计划');
  }

  return suggestions;
}
