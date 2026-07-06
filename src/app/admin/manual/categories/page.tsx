import { AdminPaginationLinks } from "@/components/admin/admin-pagination-links";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

import { CategoryEditor } from "@/components/admin/category-editor";

import { createManualCategory, deleteManualCategory, toggleCategoryVisibility, updateManualCategory } from "./actions";

const PAGE_SIZE = 20;

export default async function AdminManualCategoriesPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminSession();
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(String(page || "1"), 10) || 1);

  const [categories, totalCategories, assets] = await Promise.all([
    prisma.manualCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { chapters: true } } },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.manualCategory.count(),
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  const mediaOptions = assets.map((asset) => ({
    id: asset.id,
    title: asset.title,
    filePath: asset.filePath,
    category: asset.category
  }));
  const totalPages = Math.max(1, Math.ceil(totalCategories / PAGE_SIZE));

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>新增栏目</h2>
            <p className="muted">创建手册栏目，每个栏目下可以包含多篇文章。</p>
          </div>
          <a className="button-ghost" href="/admin/manual">
            返回文章管理
          </a>
        </div>
        <CategoryEditor action={createManualCategory} submitLabel="新增栏目" mediaOptions={mediaOptions} />
      </section>

      <section className="admin-card">
        <h2>已有栏目</h2>
        <div className="admin-stack">
          {categories.length === 0 ? (
            <div className="empty-state">还没有栏目。先新增一个栏目，再在栏目下添加文章。</div>
          ) : (
            categories.map((category) => (
              <details className="post-item post-item-collapsible" key={category.id}>
                <summary className="post-item-summary">
                  <div>
                    <strong>{category.titleZh}</strong>
                    <div className="post-meta">
                      <span>slug: {category.slug}</span>
                      <span>排序：{category.sortOrder}</span>
                      <span>文章：{category._count.chapters} 篇</span>
                      <span>状态：{category.isVisible ? "对外可见" : "已隐藏"}</span>
                    </div>
                  </div>
                </summary>

                <div className="post-item-body">
                  <CategoryEditor
                    action={updateManualCategory}
                    submitLabel="保存修改"
                    mediaOptions={mediaOptions}
                    initialValues={{
                      id: category.id,
                      slug: category.slug,
                      titleZh: category.titleZh,
                      summaryZh: category.summaryZh || "",
                      sortOrder: category.sortOrder,
                      coverImagePath: category.coverImagePath,
                      isVisible: category.isVisible
                    }}
                  />

                  <div className="post-actions">
                    <AdminActionForm action={toggleCategoryVisibility} className="" successMessage="栏目可见性已更新。">
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="isVisible" value={String(category.isVisible)} />
                      <button className="button-ghost" type="submit">
                        {category.isVisible ? "设为隐藏" : "设为可见"}
                      </button>
                    </AdminActionForm>
                    <AdminActionForm
                      action={deleteManualCategory}
                      className=""
                      successMessage="栏目已删除。"
                      confirmMessage={`确认删除栏目「${category.titleZh}」？`}
                    >
                      <input type="hidden" name="id" value={category.id} />
                      <button className="button-ghost danger-text" type="submit">
                        删除栏目
                      </button>
                    </AdminActionForm>
                  </div>
                </div>
              </details>
            ))
          )}
          <AdminPaginationLinks basePath="/admin/manual/categories" currentPage={currentPage} totalPages={totalPages} />
        </div>
      </section>
    </div>
  );
}
