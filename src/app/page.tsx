import { HomePhotoShowcase } from "@/components/site/home-photo-showcase";
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
      where: { status: "PUBLISHED", isFeatured: true },
      orderBy: { updatedAt: "desc" },
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
      take: 15
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
            <HomePhotoShowcase
              photos={featuredPhotos.map((photo) => ({
                id: photo.id,
                title: photo.titleZh,
                imagePath: photo.imagePath
              }))}
            />
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
                  <strong>还没有已发布活动</strong>
                  <p>你们可以先去后台新增活动预告，填写时间、地点、封面和公众号链接，再点击“发布”。</p>
                </article>
              ) : (
                featuredNotices.map((notice) => (
                  <article className={cardClassName} key={notice.id}>
                    <MediaFrame src={notice.coverImagePath} alt={notice.titleZh} className="content-cover" label="活动封面" />
                    <strong>{notice.titleZh}</strong>
                    <p>{notice.summaryZh || "点击后查看活动详情或跳转到外部活动页面。"}</p>
                    <p className="muted">地点：{notice.locationZh || "待补充"}</p>
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
                  <strong>还没有已发布科普文章</strong>
                  <p>你们可以先去后台新增科普文章，并填写公众号原文链接。</p>
                </article>
              ) : (
                featuredPosts.map((post) => (
                  <article className={cardClassName} key={post.id}>
                    <MediaFrame src={post.coverImagePath} alt={post.titleZh} className="content-cover" label="科普封面" />
                    <strong>{post.titleZh}</strong>
                    <p>{post.summaryZh || "点击后跳转到你们的公众号原文。"}</p>
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
