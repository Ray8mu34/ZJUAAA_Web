import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
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
    <section className="admin-grid">
      <article className="admin-card">
        <h2>后台概览</h2>
        <ul>
          <li>管理员账号：{admins.length}</li>
          <li>知识科普条目：{posts}</li>
          <li>天文手册章节：{manuals}</li>
          <li>社团活动条目：{notices}</li>
        </ul>
      </article>
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
          <a className="button-link" href="/admin/site">
            首页管理
          </a>
          <a className="button-secondary" href="/admin/posts">
            知识科普
          </a>
          <a className="button-secondary" href="/admin/activities">
            社团活动
          </a>
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
    </section>
  );
}
