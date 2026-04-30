import { AstroPhotoMasonry } from "@/components/site/astro-photo-masonry";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";
import { shuffleItems } from "@/lib/random-order";

export const dynamic = "force-dynamic";

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
  const randomizedPhotos = shuffleItems(photos);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <h2>天文摄影</h2>
              <p className="muted">
                {setting.galleryIntroZh || "这里展示已发布的摄影作品，后续可继续接入作品图片和更多高级参数。"}
              </p>
            </div>
            <p className="muted">共 {photos.length} 幅作品</p>
          </div>

          <form className="search-form" action="/astrophotography">
            <input name="q" defaultValue={q} placeholder="搜索作品标题、拍摄者或天区" />
            <button className="button-secondary" type="submit">
              搜索
            </button>
          </form>

          <AstroPhotoMasonry
            photos={randomizedPhotos.map((photo) => ({
              id: photo.id,
              title: photo.titleZh,
              description: photo.descriptionZh || "点击后查看作品详情。",
              photographer: photo.photographer,
              skyRegion: photo.skyRegionZh,
              location: photo.locationZh,
              mainLens: photo.equipmentMainLens,
              camera: photo.equipmentCamera,
              mount: photo.equipmentMount,
              filter: photo.equipmentFilter,
              software: photo.equipmentSoftware,
              imagePath: photo.imagePath
            }))}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
