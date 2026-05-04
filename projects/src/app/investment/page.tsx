import type { Metadata } from 'next';
import { Cormorant_Garamond, Noto_Sans_SC } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  title: '招商落地页',
  description: '罗湖星宠汇高端杂志风招商落地页',
};

const highlights = [
  { label: '核心商铺', value: '40+', note: '可灵活分割 50-300m2' },
  { label: '辐射人群', value: '18.2万', note: '5 公里养宠家庭' },
  { label: '商业动线', value: '24h', note: '全天候商业港' },
  { label: '场景面积', value: '2500m2', note: '内铺可持续运营' },
];

const modules = [
  '宠物洗护与美容',
  '宠物医疗与健康',
  '人宠生活方式零售',
  '宠物社交活动与课程',
  '高端寄养与酒店服务',
  '品牌快闪与联名空间',
];

export default function InvestmentPage() {
  return (
    <main className={`${notoSansSC.className} page-shell`}>
      <div className="grain" aria-hidden />
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-10 md:px-10 md:pb-24 md:pt-14">
        <header className="mb-16 border-b border-white/20 pb-10 md:mb-24">
          <p className="mb-6 tracking-[0.3em] text-amber-200/90 uppercase text-xs">
            LUOHU PET ECO DISTRICT
          </p>
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end">
            <h1
              className={`${cormorant.className} text-5xl font-semibold leading-[0.92] text-zinc-100 md:text-7xl`}
            >
              罗湖星宠汇
              <br />
              招商计划 2026
            </h1>
            <div className="space-y-4 border-l border-amber-200/30 pl-5">
              <p className="text-sm leading-relaxed text-zinc-300">
                用一本高端商业杂志的视觉逻辑，重构宠物生态商业体。我们不是在招租，
                而是在邀请品牌共建一座持续增长的城市宠物生活地标。
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 border border-amber-300/60 px-4 py-2 text-xs tracking-[0.2em] text-amber-100 transition hover:bg-amber-200/10"
              >
                获取招商资料
              </a>
            </div>
          </div>
        </header>

        <section className="mb-16 grid gap-4 md:mb-24 md:grid-cols-4">
          {highlights.map(item => (
            <article
              key={item.label}
              className="card-fade rounded-none border border-white/15 bg-white/5 p-5 backdrop-blur-sm"
            >
              <p className="mb-2 text-xs tracking-[0.18em] text-zinc-400">{item.label}</p>
              <p className={`${cormorant.className} mb-2 text-4xl font-semibold text-amber-100`}>
                {item.value}
              </p>
              <p className="text-xs text-zinc-300">{item.note}</p>
            </article>
          ))}
        </section>

        <section className="mb-16 grid gap-6 md:mb-24 md:grid-cols-12">
          <article className="md:col-span-7 border border-white/15 bg-zinc-900/80 p-6 md:p-10">
            <p className="mb-4 text-xs tracking-[0.18em] text-amber-200/80">PROJECT NARRATIVE</p>
            <h2 className={`${cormorant.className} mb-6 text-4xl text-zinc-100 md:text-5xl`}>
              从“宠物门店集合”
              <br />
              到“宠物生活方式场”
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-zinc-300">
              传统片区里，宠物消费高度分散、体验断裂。星宠汇通过下沉式商业空间与公园入口联动，
              将消费、社交、训练、内容传播整合成一条完整生态链，让商户获得复购、人群和品牌曝光的复合价值。
            </p>
          </article>
          <aside className="md:col-span-5 border border-amber-300/30 bg-amber-100/10 p-6 md:p-10">
            <p className="mb-3 text-xs tracking-[0.18em] text-amber-100">POSITIONING</p>
            <p className={`${cormorant.className} mb-6 text-3xl text-amber-50`}>
              城市宠物生态商业综合体
            </p>
            <ul className="space-y-3 text-sm text-amber-50/90">
              <li>• 下沉式庭院 + 舞台活动区，强化引流与停留</li>
              <li>• 人宠友好动线，支持全天候运营</li>
              <li>• 场景化运营，增强商户协同与联动转化</li>
            </ul>
          </aside>
        </section>

        <section className="mb-16 md:mb-24">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-white/20 pb-4">
            <h3 className={`${cormorant.className} text-4xl text-zinc-100 md:text-5xl`}>
              招商品类矩阵
            </h3>
            <span className="text-xs tracking-[0.16em] text-zinc-400">MERCHANDISE PORTFOLIO</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {modules.map((name, idx) => (
              <div
                key={name}
                className="card-fade group flex items-center justify-between border border-white/15 bg-white/5 px-5 py-4 transition hover:border-amber-200/60 hover:bg-amber-50/5"
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <span className="text-sm text-zinc-100">{name}</span>
                <span className={`${cormorant.className} text-2xl text-amber-200/90`}>
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="border border-amber-300/30 bg-zinc-900/90 p-7 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="mb-3 text-xs tracking-[0.2em] text-amber-100/80">JOIN THE DISTRICT</p>
              <h4 className={`${cormorant.className} mb-4 text-4xl text-zinc-100 md:text-5xl`}>
                提交品牌资料，预约选铺沟通
              </h4>
              <p className="max-w-2xl text-sm leading-7 text-zinc-300">
                我们将在 24 小时内完成品牌适配评估，并提供铺位建议、联营方案与开业节奏建议。
              </p>
            </div>
            <div className="space-y-3 text-sm text-zinc-200">
              <p>招商热线：0755-8888-2026</p>
              <p>商务邮箱：leasing@petstar-hub.com</p>
              <a
                href="mailto:leasing@petstar-hub.com"
                className="inline-block border border-amber-300/60 px-5 py-3 text-xs tracking-[0.2em] text-amber-100 transition hover:bg-amber-300/10"
              >
                立即发送资料
              </a>
            </div>
          </div>
        </section>
      </section>

      <style>{`
        .page-shell {
          min-height: 100vh;
          position: relative;
          color: #f5f5f5;
          background:
            radial-gradient(circle at 15% 10%, rgba(180, 140, 76, 0.22), transparent 35%),
            radial-gradient(circle at 85% 25%, rgba(102, 88, 60, 0.18), transparent 35%),
            linear-gradient(160deg, #070709 0%, #111116 38%, #0e0f12 100%);
          overflow: hidden;
        }

        .grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.15;
          mix-blend-mode: soft-light;
          background-image: radial-gradient(#ffffff 0.6px, transparent 0.6px);
          background-size: 4px 4px;
        }

        .card-fade {
          opacity: 0;
          transform: translateY(20px);
          animation: rise 700ms ease forwards;
        }

        @keyframes rise {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
