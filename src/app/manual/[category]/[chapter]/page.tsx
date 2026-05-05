import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { MediaFrame } from "@/components/site/media-frame";
import { createHeadingId, MarkdownRenderer } from "@/components/site/markdown-renderer";
import { ManualToc } from "@/components/site/manual-toc";
import { prisma } from "@/lib/db";

type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

function extractManualToc(markdown: string): HeadingItem[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{1,3})\s+(.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      level: match[1].length,
      text: match[2].trim(),
      id: createHeadingId(match[2].trim())
    }))
    .filter((item) => item.id && item.text);
}

export default async function ManualChapterPage({
  params
}: {
  params: Promise<{ category: string; chapter: string }>;
}) {
  const { category: categorySlug, chapter: chapterSlug } = await params;

  // Find the category
  const category = await prisma.manualCategory.findFirst({
    where: {
      OR: [{ id: categorySlug }, { slug: categorySlug }],
      isVisible: true
    }
  });

  if (!category) {
    notFound();
  }

  // Find the chapter
  const current = await prisma.manualChapter.findFirst({
    where: {
      OR: [{ id: chapterSlug }, { slug: chapterSlug }],
      categoryId: category.id,
      status: "PUBLISHED"
    }
  });

  if (!current) {
    notFound();
  }

  // Get all chapters in this category for navigation
  const chapters = await prisma.manualChapter.findMany({
    where: {
      categoryId: category.id,
      status: "PUBLISHED"
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  const toc = extractManualToc(current.markdownZh);
  const currentIndex = chapters.findIndex((item) => item.id === current.id);
  const previousChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell manual-layout">
          <aside className="content-card manual-sidebar">
            <div className="manual-sidebar-scroll">
              <a className="manual-category-back" href={`/manual/${category.slug}`}>
                {category.titleZh}
              </a>
              <strong>文章目录</strong>
              <div className="manual-nav">
                {chapters.map((item) => (
                  <a
                    key={item.id}
                    href={`/manual/${category.slug}/${item.slug}`}
                    className={item.id === current.id ? "manual-link active" : "manual-link"}
                  >
                    {item.chapterNo} {item.titleZh}
                  </a>
                ))}
              </div>

              {toc.length > 0 ? <ManualToc items={toc} /> : null}
            </div>
          </aside>

          <div className="admin-stack">
            <section className="content-card">
              <p className="muted">
                <a href={`/manual/${category.slug}`}>{category.titleZh}</a> / {current.chapterNo}
              </p>
              <h1>{current.titleZh}</h1>

              {current.author || current.summaryZh ? (
                <div className="manual-chapter-meta">
                  {current.author ? <p className="manual-author">作者：{current.author}</p> : null}
                  {current.summaryZh ? <p className="manual-summary">{current.summaryZh}</p> : null}
                </div>
              ) : null}

              <MediaFrame src={current.coverImagePath} alt={current.titleZh} className="detail-cover" label="手册封面图片" />
            </section>

            <section className="content-card">
              <MarkdownRenderer content={current.markdownZh} />
            </section>

            <section className="content-card manual-pagination">
              {previousChapter ? (
                <a className="button-secondary" href={`/manual/${category.slug}/${previousChapter.slug}`}>
                  上一篇：{previousChapter.titleZh}
                </a>
              ) : (
                <span className="muted">已经是第一篇了</span>
              )}

              {nextChapter ? (
                <a className="button-primary" href={`/manual/${category.slug}/${nextChapter.slug}`}>
                  下一篇：{nextChapter.titleZh}
                </a>
              ) : (
                <span className="muted">已经是最后一篇了</span>
              )}
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
