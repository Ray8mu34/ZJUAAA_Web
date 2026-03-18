import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

export default async function ManualIndexPage() {
  const chapters = await prisma.manualChapter.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <h2>天文手册</h2>
              <p className="muted">这里收录社团内部整理的学习资料与长期积累内容，适合内部学习、查阅和后续备份。</p>
            </div>
            <p className="muted">共 {chapters.length} 章</p>
          </div>

          <section className="content-card manual-index-panel">
            <div className="manual-index-panel-head">
              <strong>手册目录</strong>
              <p className="muted">按章节顺序浏览，适合内部学习和查阅。</p>
            </div>

            {chapters.length === 0 ? (
              <div className="empty-state">还没有发布的手册章节。可以先去后台录入章节内容并发布。</div>
            ) : (
              <div className="manual-index-grid manual-index-grid-compact">
                {chapters.map((chapter) => (
                  <a key={chapter.id} className="manual-index-card" href={`/manual/${chapter.id}`}>
                    <span className="manual-card-tag">{chapter.slug}</span>
                    <strong>{chapter.titleZh}</strong>
                    {chapter.author ? <p className="manual-card-author">作者：{chapter.author}</p> : null}
                    <p className="manual-card-summary">{chapter.summaryZh || "点击进入章节阅读。"}</p>
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
