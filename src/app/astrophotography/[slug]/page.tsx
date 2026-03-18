import { notFound } from "next/navigation";

import { MediaFrame } from "@/components/site/media-frame";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

export default async function AstroPhotographyDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const photo = await prisma.astroPhoto.findFirst({
    where: {
      OR: [{ id: slug }, { slug }]
    }
  });

  if (!photo || photo.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell admin-stack">
          <section className="content-card">
            <a className="button-ghost detail-back-button" href="/astrophotography">
              返回摄影列表
            </a>
            <p className="muted">天文摄影 / {photo.photographer}</p>
            <h1>{photo.titleZh}</h1>
            <p>{photo.descriptionZh || "暂无作品介绍。"}</p>
            <MediaFrame src={photo.imagePath} alt={photo.titleZh} className="detail-cover" label="摄影作品图片" />
          </section>

          <section className="cards-grid">
            <article className="content-card">
              <strong>拍摄信息</strong>
              <p>拍摄者：{photo.photographer}</p>
              <p>天区 / 目标：{photo.skyRegionZh || "未填写"}</p>
              <p>拍摄地点：{photo.locationZh || "未填写"}</p>
            </article>

            <article className="content-card">
              <strong>器材信息</strong>
              <p>主镜 / 镜头：{photo.equipmentMainLens || "未填写"}</p>
              <p>相机：{photo.equipmentCamera || "未填写"}</p>
              <p>赤道仪 / 云台：{photo.equipmentMount || "未填写"}</p>
            </article>

            <article className="content-card">
              <strong>后期处理</strong>
              <p>滤镜：{photo.equipmentFilter || "未填写"}</p>
              <p>处理软件：{photo.equipmentSoftware || "未填写"}</p>
            </article>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
