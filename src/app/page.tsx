import { MediaFrame } from "@/components/site/media-frame";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

function splitHeroTitle(title: string) {
  const trimmed = title.trim();

  if (!trimmed) {
    return ["你好，我们是", "浙江大学", "学生天文爱好者协会"];
  }

  if (trimmed.includes("\n")) {
    const lines = trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length >= 3) {
      return lines.slice(0, 3);
    }
  }

  return ["你好，我们是", "浙江大学", "学生天文爱好者协会"];
}

function spreadText(text: string) {
  return Array.from(text.trim() || "追逐星辰的浙大人");
}

export default async function HomePage() {
  const [setting, featuredPosts, featuredNotices, featuredPhotos] = await Promise.all([
    prisma.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {}
    }),
    prisma.knowledgePost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3
    }),
    prisma.activityNotice.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ startAt: "asc" }, { createdAt: "desc" }],
      take: 3
    }),
    prisma.astroPhoto.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      take: 3
    })
  ]);

  const heroLines = splitHeroTitle(setting.heroTitleZh);
  const heroSubtitle = spreadText(setting.heroSubtitleZh);
  const manifesto = setting.manifestoZh?.trim() || "由此，上达群星";
  const cardClassName = setting.cardTheme === "light" ? "content-card card-theme-light" : "content-card";

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <h1 className="hero-title">
                <span className="gradient hero-gradient-block">
                  {heroLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
                <span className="hero-manifesto">{manifesto}</span>
              </h1>
              <p className="hero-subtitle hero-subtitle-spread" aria-label={setting.heroSubtitleZh || "追逐星辰的浙大人"}>
                {heroSubtitle.map((character, index) => (
                  <span key={`${character}-${index}`}>{character === " " ? "\u00A0" : character}</span>
                ))}
              </p>
              <div className="hero-actions">
                <a className="button-primary" href={setting.primaryButtonHref}>
                  {setting.primaryButtonZh}
                </a>
                <a className="button-secondary" href={setting.secondaryButtonHref}>
                  {setting.secondaryButtonZh}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section home-feature-section">
          <div className="shell home-feature-shell">
            <div className="section-head">
              <div>
                <h2>摄影精选</h2>
              </div>
            </div>
            <div className="cards-grid">
              {featuredPhotos.length === 0 ? (
                <article className={cardClassName}>
                  <strong>暂时还没有摄影作品</strong>
                  <p>上传并发布摄影作品后，这里会展示最近更新的精选内容。</p>
                </article>
              ) : (
                featuredPhotos.map((photo) => (
                  <article className={cardClassName} key={photo.id}>
                    <MediaFrame src={photo.imagePath} alt={photo.titleZh} className="content-cover" label="摄影封面" />
                    <strong>{photo.titleZh}</strong>
                    <p>{photo.descriptionZh || "点击后可查看作品详情。"}</p>
                    <p className="muted">作者：{photo.photographer}</p>
                    <a className="button-secondary" href={`/astrophotography/${photo.id}`}>
                      查看作品
                    </a>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="section home-feature-section home-feature-section-right">
          <div className="shell home-feature-shell">
            <div className="section-head">
              <div className="home-feature-title-right">
                <h2>近期活动</h2>
              </div>
            </div>
            <div className="cards-grid">
              {featuredNotices.length === 0 ? (
                <article className={cardClassName}>
                  <strong>暂时还没有活动预告</strong>
                  <p>等后台发布新活动后，这里会自动显示最近的活动精选。</p>
                </article>
              ) : (
                featuredNotices.map((notice) => (
                  <article className={cardClassName} key={notice.id}>
                    <MediaFrame
                      src={notice.coverImagePath}
                      alt={notice.titleZh}
                      className="content-cover"
                      label="活动封面"
                    />
                    <strong>{notice.titleZh}</strong>
                    <p>{notice.summaryZh || "点击后可跳转到活动详情或公众号推文。"}</p>
                    <p className="muted">地点：{notice.locationZh || "待公布"}</p>
                    {notice.externalUrl ? (
                      <a className="button-secondary" href={notice.externalUrl} target="_blank" rel="noreferrer">
                        查看活动
                      </a>
                    ) : (
                      <a className="button-secondary" href="/activities">
                        查看活动
                      </a>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="section home-feature-section">
          <div className="shell home-feature-shell">
            <div className="section-head">
              <div>
                <h2>科普推荐</h2>
              </div>
            </div>
            <div className="cards-grid">
              {featuredPosts.length === 0 ? (
                <article className={cardClassName}>
                  <strong>暂时还没有科普内容</strong>
                  <p>后台发布新的科普文章后，这里就会自动显示近期精选。</p>
                </article>
              ) : (
                featuredPosts.map((post) => (
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
        </section>

        <section className="section home-ending-section">
          <div className="shell">
            <div className="home-ending-copy">
              <p>我们是</p>
              <p>黑夜中的神秘追光者</p>
              <p className="gradient home-ending-highlight">
                <span>这很天协</span>
                <span aria-hidden="true" className="home-ending-arrow">
                  ↗
                </span>
              </p>
            </div>
            <div className="home-ending-line" aria-hidden="true" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
