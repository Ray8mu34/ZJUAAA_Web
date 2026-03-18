import { MediaFrame } from "@/components/site/media-frame";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

export default async function AstroPhotographyPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = (await searchParams) || {};
  const q = params.q?.trim() || "";

  const [setting, photos] = await Promise.all([
    prisma.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {}
    }),
    prisma.astroPhoto.findMany({
      where: {
        status: "PUBLISHED",
        ...(q
          ? {
              OR: [
                { titleZh: { contains: q } },
                { descriptionZh: { contains: q } },
                { photographer: { contains: q } },
                { skyRegionZh: { contains: q } }
              ]
            }
          : {})
      },
      orderBy: { updatedAt: "desc" }
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
              <h2>天文摄影</h2>
              <p className="muted">这里展示已发布的摄影作品，后续可继续接入作品图片和更多高级参数。</p>
            </div>
            <p className="muted">共 {photos.length} 张作品</p>
          </div>

          <form className="search-form" action="/astrophotography">
            <input name="q" defaultValue={q} placeholder="搜索作品标题、拍摄者或天区" />
            <button className="button-secondary" type="submit">
              搜索
            </button>
          </form>

          <div className="cards-grid">
            {photos.length === 0 ? (
              <article className={cardClassName}>
                <strong>还没有已发布作品</strong>
                <p>可以先去后台录入摄影作品并发布。</p>
              </article>
            ) : (
              photos.map((photo) => (
                <article className={cardClassName} key={photo.id}>
                  <MediaFrame src={photo.imagePath} alt={photo.titleZh} className="content-cover" label="摄影封面" />
                  <strong>{photo.titleZh}</strong>
                  <p>{photo.descriptionZh || "点击后可查看作品详情。"}</p>
                  <p className="muted">拍摄者：{photo.photographer}</p>
                  <a className="button-secondary" href={`/astrophotography/${photo.id}`}>
                    查看作品
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
