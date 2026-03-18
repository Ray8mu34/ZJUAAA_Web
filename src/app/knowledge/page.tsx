import { MediaFrame } from "@/components/site/media-frame";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

export default async function KnowledgePage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = (await searchParams) || {};
  const q = params.q?.trim() || "";

  const [setting, posts] = await Promise.all([
    prisma.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {}
    }),
    prisma.knowledgePost.findMany({
      where: {
        status: "PUBLISHED",
        ...(q
          ? {
              OR: [
                { titleZh: { contains: q } },
                { summaryZh: { contains: q } },
                { author: { contains: q } }
              ]
            }
          : {})
      },
      orderBy: { publishedAt: "desc" }
    })
  ]);

  const cardClassName = setting.cardTheme === "light" ? "content-card card-theme-light" : "content-card";

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <h2>知识科普</h2>
              <p className="muted">这里展示科普文章封面与摘要。点击卡片后，会跳转到你们的公众号原文。</p>
            </div>
            <p className="muted">共 {posts.length} 篇内容</p>
          </div>

          <form className="search-form" action="/knowledge">
            <input name="q" defaultValue={q} placeholder="搜索标题、摘要或作者" />
            <button className="button-secondary" type="submit">
              搜索
            </button>
          </form>

          <div className="cards-grid">
            {posts.length === 0 ? (
              <div className={cardClassName}>
                <strong>还没有已发布的科普文章</strong>
                <p>可以先去后台发布内容，前台这里会自动显示。</p>
              </div>
            ) : (
              posts.map((post) => (
                <article className={cardClassName} key={post.id}>
                  <MediaFrame src={post.coverImagePath} alt={post.titleZh} className="content-cover" label="科普封面" />
                  <strong>{post.titleZh}</strong>
                  <p>{post.summaryZh || "点击后可跳转到公众号原文查看完整内容。"}</p>
                  <p className="muted">作者：{post.author}</p>
                  <a
                    className="button-secondary"
                    href={post.externalUrl || `/knowledge/${post.slug}`}
                    target={post.externalUrl ? "_blank" : undefined}
                    rel={post.externalUrl ? "noreferrer" : undefined}
                  >
                    {post.externalUrl ? "跳转公众号" : "阅读更多"}
                  </a>
                </article>
              ))
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
