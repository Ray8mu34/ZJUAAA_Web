import { AboutGalleryLightbox } from "@/components/site/about-gallery-lightbox";
import { AboutSectionShell } from "@/components/site/about-section-shell";
import { parseAboutGalleryPaths } from "@/lib/about-content";
import { prisma } from "@/lib/db";
import { shuffleItems } from "@/lib/random-order";

export const dynamic = "force-dynamic";

export default async function AboutGalleryPage() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: "site" },
    select: { aboutIntroZh: true, aboutGalleryImagePaths: true }
  });
  const galleryPaths = shuffleItems(parseAboutGalleryPaths(setting?.aboutGalleryImagePaths));

  return (
    <AboutSectionShell active="gallery" introduction={setting?.aboutIntroZh}>
      <section className="about-gallery-content" aria-labelledby="about-gallery-title" data-reveal>
        <div className="about-content-heading">
          <h2 id="about-gallery-title">社团照片</h2>
          <span className="muted">共 {galleryPaths.length} 张</span>
        </div>

        {galleryPaths.length === 0 ? (
          <div className="empty-state">还没有配置照片墙图片。</div>
        ) : (
          <AboutGalleryLightbox
            images={galleryPaths.map((path, index) => ({ src: path, alt: `社团照片 ${index + 1}` }))}
          />
        )}
      </section>
    </AboutSectionShell>
  );
}
