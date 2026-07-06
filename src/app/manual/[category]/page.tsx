import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

function formatManualDate(value: Date) {
  return value.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

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
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 120
  });

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          <section className="manual-category-head">
            <Link className="manual-category-parent" href="/manual">
              天文手册
            </Link>
            <h1>{category.titleZh}</h1>
            {category.summaryZh ? <p>{category.summaryZh}</p> : null}
            <span>{chapters.length} 篇文章</span>
          </section>

          {/* Chapter list */}
          <section className="manual-chapter-list">
            {chapters.length === 0 ? (
              <div className="empty-state">该栏目下还没有发布的文章。</div>
            ) : (
              chapters.map((chapter, index) => (
                <Link key={chapter.id} className="manual-chapter-card manual-post-card" href={`/manual/${category.slug}/${chapter.slug}`}>
                  <div className="manual-post-index" aria-hidden="true">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <time>{formatManualDate(chapter.updatedAt)}</time>
                  </div>
                  <div className="manual-chapter-info manual-post-body">
                    <span className="manual-chapter-no">{chapter.chapterNo}</span>
                    <strong>{chapter.titleZh}</strong>
                    {chapter.author ? <p className="manual-card-author">作者：{chapter.author}</p> : null}
                    {chapter.summaryZh ? <p className="manual-card-summary">{chapter.summaryZh}</p> : null}
                  </div>
                </Link>
              ))
            )}
          </section>

          <div className="manual-back-link">
            <Link className="button-ghost" href="/manual">
              返回栏目总览
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
