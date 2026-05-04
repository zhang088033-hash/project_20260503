import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { PDFParse } from 'pdf-parse';

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '.env') });

const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY;
const SOURCE_DIR = path.join(process.cwd(), 'docs', 'source');
const OUTPUT_DIR = path.join(process.cwd(), 'docs');

interface ExtractedContent {
  filename: string;
  content: string;
  pages: number;
}

async function extractTextFromPDF(filePath: string): Promise<ExtractedContent> {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  try {
    const result = await parser.getText();
    return {
      filename: path.basename(filePath),
      content: result.text,
      pages: result.total
    };
  } finally {
    await parser.destroy();
  }
}

async function callSiliconFlowAI(content: string, filename: string): Promise<string> {
  if (!SILICONFLOW_API_KEY) {
    throw new Error('SILICONFLOW_API_KEY not configured');
  }

  const prompt = `请分析以下文档内容，提取关键信息并整理成结构化的知识库格式。

文档名称：${filename}

文档内容：
${content.substring(0, 8000)}

请提取并整理以下信息：
1. 文档类型和概述
2. 核心内容要点（3-5个）
3. 关键数据或指标
4. 目标用户或服务对象
5. 主要功能或服务
6. 重要的约束条件或规范

以Markdown格式返回整理后的内容。`;

  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SILICONFLOW_API_KEY}`
    },
    body: JSON.stringify({
      model: 'Pro/zai-org/GLM-4.7',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文档分析助手，擅长从各类文档中提取关键信息，并以结构化的Markdown格式输出。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4096,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`SiliconFlow API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function processDocuments(): Promise<void> {
  console.log('🚀 开始处理文档...\n');

  if (!SILICONFLOW_API_KEY) {
    console.error('❌ 错误：未配置 SILICONFLOW_API_KEY');
    console.log('请在 .env 文件中设置 SILICONFLOW_API_KEY');
    process.exit(1);
  }

  if (!fs.existsSync(SOURCE_DIR)) {
    fs.mkdirSync(SOURCE_DIR, { recursive: true });
    console.log(`📁 已创建源文件目录: ${SOURCE_DIR}`);
    console.log('请将PDF文件放入该目录后重新运行脚本。\n');
    return;
  }

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

  if (files.length === 0) {
    console.log('📂 源文件目录为空，请将PDF文件放入以下目录：');
    console.log(`   ${SOURCE_DIR}\n`);
    return;
  }

  console.log(`📄 找到 ${files.length} 个PDF文件\n`);

  const results: { filename: string; success: boolean; output?: string; error?: string }[] = [];

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    console.log(`📖 正在处理: ${file}`);

    try {
      const extracted = await extractTextFromPDF(filePath);
      console.log(`   - 已提取 ${extracted.pages} 页内容`);

      console.log(`   - 正在调用AI分析...`);
      const organized = await callSiliconFlowAI(extracted.content, file);
      console.log(`   - AI分析完成`);

      const outputFile = path.join(OUTPUT_DIR, `processed_${file.replace('.pdf', '.md')}`);
      fs.writeFileSync(outputFile, organized, 'utf-8');
      console.log(`   ✅ 已保存: ${outputFile}\n`);

      results.push({ filename: file, success: true, output: outputFile });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ 处理失败: ${errorMessage}\n`);
      results.push({ filename: file, success: false, error: errorMessage });
    }
  }

  console.log('='.repeat(50));
  console.log('📊 处理完成！\n');
  console.log(`成功: ${results.filter(r => r.success).length} 个`);
  console.log(`失败: ${results.filter(r => !r.success).length} 个`);

  if (results.filter(r => !r.success).length > 0) {
    console.log('\n失败的文件:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.filename}: ${r.error}`);
    });
  }
}

processDocuments().catch(console.error);
