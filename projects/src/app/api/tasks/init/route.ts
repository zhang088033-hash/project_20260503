import { NextResponse } from 'next/server';
import { getDrizzleClient } from '@/storage/database/supabase-client';
import { tasks } from '@/storage/database/shared/schema';

// 罗湖星宠汇小红书达人对接任务（5月-7月）
const talentTasks = [
  // ========== P0 核心任务 ==========
  {
    title: '制定小红书达人筛选标准',
    description: '分梯队明确粉丝量、赛道、地域、合作预算。优先选「深圳本地宠物赛道」「深圳商业探店/选址赛道」，兼顾深港跨境达人',
    priority: 'P0',
    module: '达人对接模块',
    deadline: '2026-05-01T00:00:00Z',
    deliverables: '小红书达人筛选标准+预算分配表',
    responsible_person: '市场部',
    status: 'pending'
  },
  {
    title: '筛选核心达人名单',
    description: '第一梯队腰部达人（1-10万粉，深圳本地）5名；第二梯队素人达人（1000-1万粉，深圳宠主/开店博主）20名。腰部达人做品牌背书+招商曝光，素人达人铺量+打造话题热度',
    priority: 'P0',
    module: '达人对接模块',
    deadline: '2026-05-05T00:00:00Z',
    deliverables: '小红书达人对接名单（含账号信息、粉丝量、联系方式、报价、过往数据）',
    responsible_person: '商务部',
    status: 'pending'
  },
  {
    title: '制定达人合作方案',
    description: '明确合作模式（置换/付费/分佣）、内容要求、发布时间、招商信息硬性植入规则。所有内容必须植入2个核心信息：①项目核心招商优势 ②招商合作联系方式，禁止纯打卡无招商信息',
    priority: 'P0',
    module: '达人对接模块',
    deadline: '2026-05-10T00:00:00Z',
    deliverables: '达人合作brief模板+合作协议模板',
    responsible_person: '市场部',
    status: 'pending'
  },
  {
    title: '启动第一波达人对接',
    description: '完成5名腰部达人签约，敲定内容发布排期。第一波内容集中在5月下旬发布，打造首轮话题热度',
    priority: 'P0',
    module: '达人对接模块',
    deadline: '2026-05-20T00:00:00Z',
    deliverables: '达人合作签约表+内容排期表',
    responsible_person: '商务部',
    status: 'pending'
  },
  {
    title: '启动素人达人铺量',
    description: '完成20名素人达人签约，分批次发布内容，打造#深圳星宠汇 #罗湖宠物社交新地标 专属话题。目标话题曝光量100万+，登上深圳本地热搜榜',
    priority: 'P0',
    module: '达人对接模块',
    deadline: '2026-05-31T00:00:00Z',
    deliverables: '素人达人发布台账+话题热度追踪表',
    responsible_person: '新媒体部',
    status: 'pending'
  },

  // ========== P1 重要任务 ==========
  {
    title: '达人内容数据追踪与转化',
    description: '达人内容发布后72小时内完成数据追踪、评论区维护、意向客户引流，制定标准化转化SOP。重点跟进评论区「怎么入驻」「租金多少」等B端咨询，24小时内响应',
    priority: 'P1',
    module: '达人对接模块',
    deadline: '2026-06-15T00:00:00Z',
    deliverables: '达人内容数据复盘表+意向客户跟进台账',
    responsible_person: '新媒体部',
    status: 'pending'
  },
  {
    title: '筛选深港跨境达人',
    description: '筛选3-5名深港跨境达人（香港宠主博主，常往返深港），针对性制定合作方案。贴合项目区位优势，打造深港宠主首选地的差异化卖点',
    priority: 'P1',
    module: '达人对接模块',
    deadline: '2026-06-15T00:00:00Z',
    deliverables: '跨境达人合作方案+签约表',
    responsible_person: '商务部',
    status: 'pending'
  },
  {
    title: '筛选头部达人深度合作',
    description: '筛选1-2名深圳头部宠物/商业达人（10万粉以上），制定深度合作方案（冠名活动、招商大使、长期联营）。用于开业造势，提升项目品牌影响力',
    priority: 'P1',
    module: '达人对接模块',
    deadline: '2026-06-10T00:00:00Z',
    deliverables: '头部达人深度合作方案',
    responsible_person: '商务部',
    status: 'pending'
  },

  // ========== P2 优化任务 ==========
  {
    title: '搭建达人招商分销体系',
    description: '打造达人专属招商政策，推荐商家入驻成功给予佣金奖励，撬动达人私域资源，实现长期招商转化',
    priority: 'P2',
    module: '达人对接模块',
    deadline: '2026-06-01T00:00:00Z',
    deliverables: '达人分销合作方案',
    responsible_person: '招商部',
    status: 'pending'
  },
  {
    title: '招募星宠体验官',
    description: '邀请优质合作达人成为项目「星宠体验官」，参与开业活动、长期内容合作，持续为项目造势，沉淀长期内容合作资源',
    priority: 'P2',
    module: '达人对接模块',
    deadline: '2026-07-15T00:00:00Z',
    deliverables: '体验官签约表+活动方案',
    responsible_person: '市场部',
    status: 'pending'
  }
];

export async function GET() {
  try {
    const db = await getDrizzleClient();
    
    // 检查是否已有数据
    const existing = await db.select({ id: tasks.id }).from(tasks).limit(1);
    
    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: '数据已存在，无需重复初始化',
        count: existing.length 
      });
    }
    
    // 插入任务数据
    const data = await db.insert(tasks).values(talentTasks).returning();
    
    return NextResponse.json({ 
      success: true, 
      message: '达人对接任务初始化成功',
      count: data?.length || 0 
    });
    
  } catch (error) {
    console.error('初始化失败:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '初始化失败' }, { status: 500 });
  }
}
