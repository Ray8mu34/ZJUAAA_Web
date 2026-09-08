import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  await requireAdminSession();

  const [admins, posts, manuals, notices] = await Promise.all([
    prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.knowledgePost.count(),
    prisma.manualChapter.count(),
    prisma.activityNotice.count()
  ]);

  return (
    <div className="admin-stack">
      <AdminPageHeader eyebrow="WORKSPACE / OVERVIEW" title="内容概览" description="快速查看内容规模并进入常用编辑任务。" />
      <section className="admin-metric-strip">
        <Link href="/admin/posts"><span>科普文章</span><strong>{posts}</strong></Link>
        <Link href="/admin/manual"><span>手册章节</span><strong>{manuals}</strong></Link>
        <Link href="/admin/activities"><span>社团活动</span><strong>{notices}</strong></Link>
        <Link href="/admin/admins"><span>管理员</span><strong>{admins.length}</strong></Link>
      </section>
    <section className="admin-grid">
      <article className="admin-card">
        <h2>最近管理员</h2>
        <ul>
          {admins.map((admin) => (
            <li key={admin.id}>
              {admin.displayName}（{admin.username}）
            </li>
          ))}
        </ul>
      </article>
      <article className="admin-card">
        <h2>常用入口</h2>
        <div className="admin-actions">
          <Link className="button-link" href="/admin/site">
            首页管理
          </Link>
          <Link className="button-secondary" href="/admin/posts">
            知识科普
          </Link>
          <Link className="button-secondary" href="/admin/activities">
            社团活动
          </Link>
        </div>
      </article>
      <article className="admin-card">
        <h2>首页管理</h2>
        <p className="muted">这里可以更新首页主标题、按钮、Hero 图片、协会 logo 和页脚基础信息。</p>
        <div className="empty-state">建议先上传图片到媒体库，再去首页管理里绑定对应图片。</div>
      </article>
      <article className="admin-card">
        <h2>媒体库</h2>
        <p className="muted">图片统一从媒体库上传，再在首页、科普、活动、摄影等模块中选择使用。</p>
      </article>
      <article className="admin-card">
        <h2>内容策略</h2>
        <p className="muted">知识科普和社团活动现在以外链卡片为主，天文手册继续保留站内 Markdown 正文作为备份。</p>
      </article>
    </section></div>
  );
}
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
