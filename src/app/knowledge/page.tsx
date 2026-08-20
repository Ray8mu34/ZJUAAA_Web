import { MediaFrame } from "@/components/site/media-frame";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

const knowledgeDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Shanghai"
});

function formatKnowledgeDate(date: Date) {
  const parts = knowledgeDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return [year, month, day].filter(Boolean).join(".");
}

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
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: 60
    })
  ]);

  const introduction = (setting.knowledgeIntroZh || "这里展示科普文章封面与摘要。点击文章后，会跳转到原文。")
    .replace("点击卡片后", "点击文章后");

  return (
    <>
      <SiteHeader />
      <main className="section knowledge-index-page">
        <div className="shell">
          <div className="section-head" data-reveal>
            <div>
              <h2>知识科普</h2>
              <p className="muted">{introduction}</p>
            </div>
            <p className="muted">共 {posts.length} 篇内容</p>
          </div>

          <form className="search-form editorial-search" action="/knowledge" data-reveal>
            <label htmlFor="knowledge-search-input">检索科普</label>
            <input id="knowledge-search-input" name="q" defaultValue={q} placeholder="标题、摘要或作者" />
            <button type="submit">搜索</button>
          </form>

          <div className="knowledge-index-list" data-reveal>
            {posts.length === 0 ? (
              <div className="knowledge-index-empty">
                <strong>还没有已发布的科普文章</strong>
                {q ? <p>没有找到与“{q}”相关的内容。</p> : null}
              </div>
            ) : (
              posts.map((post) => {
                const articleDate = formatKnowledgeDate(post.publishedAt || post.createdAt);
                const author = post.author?.trim();

                return (
                  <a
                    className="knowledge-index-row"
                    href={post.externalUrl || `/knowledge/${post.slug}`}
                    target={post.externalUrl ? "_blank" : undefined}
                    rel={post.externalUrl ? "noreferrer" : undefined}
                    data-reveal-item
                    key={post.id}
                  >
                    <span className="knowledge-index-media" aria-hidden="true">
                      <MediaFrame
                        src={post.coverImagePath}
                        alt=""
                        className="knowledge-index-cover"
                        label="科普封面"
                        sizes="(max-width: 680px) 34vw, (max-width: 1120px) 240px, 320px"
                      />
                    </span>

                    <span className="knowledge-index-copy">
                      <strong className="knowledge-index-title">{post.titleZh}</strong>
                      {post.summaryZh ? <span className="knowledge-index-summary">{post.summaryZh}</span> : null}

                      <span className="knowledge-index-footer">
                        <span className="knowledge-index-byline">
                          {author ? <span>{author}</span> : null}
                          {author && articleDate ? <span aria-hidden="true">·</span> : null}
                          {articleDate ? <time dateTime={(post.publishedAt || post.createdAt).toISOString()}>{articleDate}</time> : null}
                        </span>
                        <span className="knowledge-index-read">
                          阅读文章
                          <span className="knowledge-index-arrow" aria-hidden="true">
                            {post.externalUrl ? "↗" : "→"}
                          </span>
                        </span>
                      </span>
                    </span>
                  </a>
                );
              })
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
