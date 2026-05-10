import Image from "next/image";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";
import { getImageVariantUrl } from "@/lib/image-variants";

export default async function ManualCategoryPage({
  params
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;

  const category = await prisma.manualCategory.findFirst({
    where: {
      OR: [{ id: categorySlug }, { slug: categorySlug }],
      isVisible: true
    }
  });

  if (!category) {
    notFound();
  }

  const chapters = await prisma.manualChapter.findMany({
    where: {
      categoryId: category.id,
      status: "PUBLISHED"
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          {/* Category hero */}
          <section className="manual-category-hero content-card">
            {category.coverImagePath ? (
              <div className="manual-category-hero-cover">
                <Image
                  src={getImageVariantUrl(category.coverImagePath, "original")}
                  alt={category.titleZh}
                  fill
                  sizes="100vw"
                  priority
                />
                <div className="manual-category-overlay">
                  <div className="manual-category-hero-info">
                    <h1>{category.titleZh}</h1>
                    {category.summaryZh ? <p>{category.summaryZh}</p> : null}
                    <span className="manual-category-count">{chapters.length} 篇文章</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="manual-category-hero-cover manual-category-placeholder">
                <div className="manual-category-overlay">
                  <div className="manual-category-hero-info">
                    <h1>{category.titleZh}</h1>
                    {category.summaryZh ? <p>{category.summaryZh}</p> : null}
                    <span className="manual-category-count">{chapters.length} 篇文章</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Chapter list */}
          <section className="manual-chapter-list">
            {chapters.length === 0 ? (
              <div className="empty-state">该栏目下还没有发布的文章。</div>
            ) : (
              chapters.map((chapter) => (
                <a key={chapter.id} className="manual-chapter-card content-card" href={`/manual/${category.slug}/${chapter.slug}`}>
                  <div className="manual-chapter-info">
                    <span className="manual-chapter-no">{chapter.chapterNo}</span>
                    <strong>{chapter.titleZh}</strong>
                    {chapter.author ? <p className="manual-card-author">作者：{chapter.author}</p> : null}
                    {chapter.summaryZh ? <p className="manual-card-summary">{chapter.summaryZh}</p> : null}
                  </div>
                </a>
              ))
            )}
          </section>

          <div className="manual-back-link">
            <a className="button-ghost" href="/manual">
              返回栏目总览
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
