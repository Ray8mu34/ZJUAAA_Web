import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { AdminPageHeader, AdminStatus } from "@/components/admin/admin-page-header";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

type RecentItem = { id: string; title: string; kind: string; href: string; status: string; updatedAt: Date };

export default async function AdminDashboardPage() {
  await requireAdminSession();

  const [adminCount, postCount, manualCount, activityCount, photoCount, mediaCount, posts, manuals, activities, photos, setting] = await Promise.all([
    prisma.adminUser.count(), prisma.knowledgePost.count(), prisma.manualChapter.count(), prisma.activityNotice.count(), prisma.astroPhoto.count(), prisma.mediaAsset.count(),
    prisma.knowledgePost.findMany({ orderBy: { updatedAt: "desc" }, take: 4 }),
    prisma.manualChapter.findMany({ orderBy: { updatedAt: "desc" }, take: 4 }),
    prisma.activityNotice.findMany({ orderBy: { updatedAt: "desc" }, take: 4 }),
    prisma.astroPhoto.findMany({ orderBy: { updatedAt: "desc" }, take: 4 }),
    prisma.siteSetting.findUnique({ where: { id: "site" } })
  ]);

  const recent: RecentItem[] = [
    ...posts.map((item) => ({ id: item.id, title: item.titleZh, kind: "科普文章", href: `/admin/posts/${item.id}`, status: item.status, updatedAt: item.updatedAt })),
    ...manuals.map((item) => ({ id: item.id, title: item.titleZh, kind: "手册章节", href: `/admin/manual/${item.id}`, status: item.status, updatedAt: item.updatedAt })),
    ...activities.map((item) => ({ id: item.id, title: item.titleZh, kind: "社团活动", href: `/admin/activities/${item.id}`, status: item.status, updatedAt: item.updatedAt })),
    ...photos.map((item) => ({ id: item.id, title: item.titleZh, kind: "摄影作品", href: `/admin/gallery/${item.id}`, status: item.status, updatedAt: item.updatedAt }))
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6);

  const latestUpdate = recent[0]?.updatedAt || setting?.updatedAt;

  return <div className="admin-stack">
    <AdminPageHeader title="内容概览" description="快速查看内容规模并进入常用编辑任务。" />
    <section className="admin-metric-strip" aria-label="内容统计">
      <Link href="/admin/posts"><span>科普文章</span><strong>{postCount}</strong></Link>
      <Link href="/admin/manual"><span>手册章节</span><strong>{manualCount}</strong></Link>
      <Link href="/admin/activities"><span>社团活动</span><strong>{activityCount}</strong></Link>
      <Link href="/admin/admins"><span>管理员</span><strong>{adminCount}</strong></Link>
    </section>

    <section className="admin-overview-grid">
      <div className="admin-overview-section">
        <div className="admin-section-title"><h3>最近内容</h3><Link href="/admin/posts">查看全部 <ArrowUpRight size={14} /></Link></div>
        <div className="admin-recent-list">
          {recent.map((item) => <Link href={item.href} key={`${item.kind}-${item.id}`}>
            <span className="admin-recent-kind">{item.kind}</span>
            <strong>{item.title}</strong>
            <time>{item.updatedAt.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}</time>
            <AdminStatus status={item.status} />
          </Link>)}
          {recent.length === 0 ? <div className="empty-state">还没有内容，先从右侧快速入口开始。</div> : null}
        </div>
      </div>
      <aside className="admin-overview-section admin-quick-links">
        <div className="admin-section-title"><h3>快速入口</h3></div>
        <Link href="/admin/posts/new">新建科普文章 <span>→</span></Link>
        <Link href="/admin/activities/new">新建活动 <span>→</span></Link>
        <Link href="/admin/gallery/new">上传摄影作品 <span>→</span></Link>
        <Link href="/admin/site">编辑首页 <span>→</span></Link>
      </aside>
    </section>

    <section className="admin-site-status">
      <div><span>媒体库</span><strong>{mediaCount} 张图片</strong></div>
      <div><span>内容规模</span><strong>{postCount + manualCount + activityCount + photoCount} 条内容</strong></div>
      <div><span>最近更新</span><strong>{latestUpdate?.toLocaleDateString("zh-CN") || "暂无"}</strong></div>
    </section>
  </div>;
}
