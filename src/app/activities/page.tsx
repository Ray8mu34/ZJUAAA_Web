import { MediaFrame } from "@/components/site/media-frame";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

export default async function ActivitiesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = (await searchParams) || {};
  const q = params.q?.trim() || "";

  const [setting, notices] = await Promise.all([
    prisma.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {}
    }),
    prisma.activityNotice.findMany({
      where: {
        status: "PUBLISHED",
        ...(q
          ? {
              OR: [
                { titleZh: { contains: q } },
                { summaryZh: { contains: q } },
                { locationZh: { contains: q } }
              ]
            }
          : {})
      },
      orderBy: [{ startAt: "asc" }, { createdAt: "desc" }]
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
              <h2>社团活动</h2>
              <p className="muted">这里展示活动卡片信息。点击按钮后，会跳转到公众号文章或外部活动页面。</p>
            </div>
            <p className="muted">共 {notices.length} 场活动</p>
          </div>

          <form className="search-form" action="/activities">
            <input name="q" defaultValue={q} placeholder="搜索活动标题、摘要或地点" />
            <button className="button-secondary" type="submit">
              搜索
            </button>
          </form>

          <div className="cards-grid">
            {notices.length === 0 ? (
              <article className={cardClassName}>
                <strong>还没有已发布活动</strong>
                <p>可以先去后台新增活动预告，填写时间、地点、封面和外部链接，再点击“发布”。</p>
              </article>
            ) : (
              notices.map((notice) => (
                <article className={cardClassName} key={notice.id}>
                  <MediaFrame src={notice.coverImagePath} alt={notice.titleZh} className="content-cover" label="活动封面" />
                  <strong>{notice.titleZh}</strong>
                  <p>{notice.summaryZh || "点击后可跳转到活动详情或公众号推文。"}</p>
                  <p className="muted">地点：{notice.locationZh || "待公布"}</p>
                  <p className="muted">
                    时间：{notice.startAt ? notice.startAt.toLocaleString("zh-CN") : "待公布"}
                  </p>
                  {notice.externalUrl ? (
                    <a className="button-secondary" href={notice.externalUrl} target="_blank" rel="noreferrer">
                      查看活动
                    </a>
                  ) : null}
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
