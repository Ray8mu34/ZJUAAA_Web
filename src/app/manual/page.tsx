import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

export default async function ManualIndexPage() {
  const [setting, chapters] = await Promise.all([
    prisma.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {}
    }),
    prisma.manualChapter.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    })
  ]);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <h2>天文手册</h2>
              <p className="muted">
                {setting.manualIntroZh || "这里收录社团内部整理的学习资料与长期积累内容，适合内部学习、查阅和后续备份。"}
              </p>
            </div>
            <p className="muted">共 {chapters.length} 章</p>
          </div>

          <section className="content-card manual-index-panel">
            {chapters.length === 0 ? (
              <div className="empty-state">还没有发布手册章节，去后台新增后就会显示在这里。</div>
            ) : (
              <div className="manual-index-grid manual-index-grid-compact">
                {chapters.map((chapter) => (
                  <a key={chapter.id} className="manual-index-card" href={`/manual/${chapter.id}`}>
                    <span className="manual-card-tag">{chapter.slug}</span>
                    <strong>{chapter.titleZh}</strong>
                    {chapter.author ? <p className="manual-card-author">作者：{chapter.author}</p> : null}
                    <p className="manual-card-summary">{chapter.summaryZh || "点击进入该章节继续阅读。"}</p>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
