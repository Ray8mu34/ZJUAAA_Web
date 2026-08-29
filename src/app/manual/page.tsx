import Image from "next/image";
import Link from "next/link";

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
      take: 60,
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
          <div className="section-head" data-reveal>
            <div>
              <h2>天文手册</h2>
              <p className="muted">
                {setting.manualIntroZh || "这里收录社团整理的天文学习资料，按栏目分类，适合系统学习与查阅。"}
              </p>
            </div>
          </div>

          {/* Category cards */}
          <section className="manual-category-grid" data-reveal>
            {categories.length === 0 ? (
              <div className="empty-state">还没有可见的栏目，请在后台管理栏目。</div>
            ) : (
              categories.map((category) => (
                <Link key={category.id} className="manual-category-card" data-reveal-item href={`/manual/${category.slug}`}>
                  <div className="manual-category-cover">
                    {category.coverImagePath ? (
                      <Image
                        src={getImageVariantUrl(category.coverImagePath, "thumb")}
                        alt={category.titleZh}
                        fill
                        sizes="(max-width: 720px) 100vw, (max-width: 980px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="manual-category-placeholder" />
                    )}
                    <div className="manual-category-overlay">
                      <strong className="manual-category-title">{category.titleZh}</strong>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
