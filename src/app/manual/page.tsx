import Image from "next/image";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";
import { getImageVariantUrl } from "@/lib/image-variants";

export default async function ManualIndexPage() {
  const [setting, categories] = await Promise.all([
    prisma.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {}
    }),
    prisma.manualCategory.findMany({
      where: { isVisible: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: { chapters: { where: { status: "PUBLISHED" } } }
        }
      }
    })
  ]);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <h2>天文手册</h2>
              <p className="muted">
                {setting.manualIntroZh || "这里收录社团整理的天文学习资料，按栏目分类，适合系统学习与查阅。"}
              </p>
            </div>
          </div>

          {/* Start entry */}
          <section className="manual-start-entry content-card">
            <div className="manual-start-content">
              <h3>第一次来到这里？</h3>
              <p className="muted">如果你是天文新手，建议从观测手册开始，逐步了解星空。</p>
              <a className="button-primary" href="/manual/observation">
                从观测手册开始
              </a>
            </div>
          </section>

          {/* Category cards */}
          <section className="manual-category-grid">
            {categories.length === 0 ? (
              <div className="empty-state">还没有可见的栏目，请在后台管理栏目。</div>
            ) : (
              categories.map((category) => (
                <a key={category.id} className="manual-category-card" href={`/manual/${category.slug}`}>
                  <div className="manual-category-cover">
                    {category.coverImagePath ? (
                      <Image
                        src={getImageVariantUrl(category.coverImagePath, "thumb")}
                        alt={category.titleZh}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="manual-category-placeholder" />
                    )}
                  </div>
                  <div className="manual-category-info">
                    <strong>{category.titleZh}</strong>
                    <p className="muted">{category.summaryZh || "点击进入查看文章列表。"}</p>
                    <span className="manual-category-count">{category._count.chapters} 篇文章</span>
                  </div>
                </a>
              ))
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
