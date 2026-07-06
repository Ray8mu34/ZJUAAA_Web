import { AdminPaginationLinks } from "@/components/admin/admin-pagination-links";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { ManualEditor } from "@/components/admin/manual-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

import { createManualChapter, deleteManualChapter, setManualChapterStatus, updateManualChapter } from "./actions";

type SearchParams = Promise<{ category?: string; page?: string }>;

const PAGE_SIZE = 20;

export default async function AdminManualPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminSession();

  const { category: filterCategoryId, page } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(String(page || "1"), 10) || 1);
  const chapterWhere = filterCategoryId ? { categoryId: filterCategoryId } : undefined;

  const [categories, chapters, totalChapters, assets] = await Promise.all([
    prisma.manualCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    }),
    prisma.manualChapter.findMany({
      where: chapterWhere,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      include: { category: { select: { titleZh: true, slug: true } } },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.manualChapter.count({ where: chapterWhere }),
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

  const categoryOptions = categories.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    titleZh: cat.titleZh
  }));

  const filterCategory = filterCategoryId ? categories.find((c) => c.id === filterCategoryId) : null;
  const totalPages = Math.max(1, Math.ceil(totalChapters / PAGE_SIZE));

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>新增手册文章</h2>
            <p className="muted">支持 Markdown 正文、封面图、作者、简介。可在编辑器中直接拖拽或粘贴图片。</p>
          </div>
          <div className="admin-card-head-actions">
            <a className="button-ghost" href="/admin/manual/categories">
              管理栏目
            </a>
            <a className="button-ghost" href="/admin/manual/import">
              批量导入
            </a>
          </div>
        </div>
        <ManualEditor action={createManualChapter} submitLabel="新增手册文章" mediaOptions={mediaOptions} categories={categoryOptions} />
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>{filterCategory ? `栏目：${filterCategory.titleZh}` : "全部文章"}</h2>
          <div className="admin-filter-bar">
            <a className={`button-ghost ${!filterCategoryId ? "active" : ""}`} href="/admin/manual">
              全部
            </a>
            {categories.map((cat) => (
              <a key={cat.id} className={`button-ghost ${filterCategoryId === cat.id ? "active" : ""}`} href={`/admin/manual?category=${cat.id}`}>
                {cat.titleZh}
              </a>
            ))}
          </div>
        </div>
        <div className="admin-stack">
          {chapters.length === 0 ? (
            <div className="empty-state">
              {filterCategory ? `栏目「${filterCategory.titleZh}」下还没有文章。` : "还没有文章。先新增一篇，保存后这里就会出现可编辑的条目。"}
            </div>
          ) : (
            chapters.map((chapter) => (
              <details className="post-item post-item-collapsible" key={chapter.id}>
                <summary className="post-item-summary">
                  <div>
                    <strong>
                      {chapter.chapterNo} {chapter.titleZh}
                    </strong>
                    <div className="post-meta">
                      <span>栏目：{chapter.category.titleZh}</span>
                      <span>slug: {chapter.slug}</span>
                      <span>排序：{chapter.sortOrder}</span>
                      <span>状态：{chapter.status}</span>
                    </div>
                  </div>
                </summary>

                <div className="post-item-body">
                  <ManualEditor
                    action={updateManualChapter}
                    submitLabel="保存修改"
                    mediaOptions={mediaOptions}
                    categories={categoryOptions}
                    initialValues={{
                      id: chapter.id,
                      slug: chapter.slug,
                      categoryId: chapter.categoryId,
                      titleZh: chapter.titleZh,
                      author: chapter.author,
                      summaryZh: chapter.summaryZh,
                      coverImagePath: chapter.coverImagePath,
                      sortOrder: chapter.sortOrder,
                      markdownZh: chapter.markdownZh
                    }}
                  />

                  <div className="post-actions">
                    <AdminActionForm action={setManualChapterStatus} className="" successMessage="文章已发布。">
                      <input type="hidden" name="id" value={chapter.id} />
                      <input type="hidden" name="status" value="PUBLISHED" />
                      <button className="button-ghost" type="submit">
                        发布
                      </button>
                    </AdminActionForm>
                    <AdminActionForm action={setManualChapterStatus} className="" successMessage="文章已设为草稿。">
                      <input type="hidden" name="id" value={chapter.id} />
                      <input type="hidden" name="status" value="DRAFT" />
                      <button className="button-ghost" type="submit">
                        设为草稿
                      </button>
                    </AdminActionForm>
                    <a className="button-ghost" href={`/manual/${chapter.category.slug}/${chapter.slug}`} target="_blank" rel="noreferrer">
                      前台查看
                    </a>
                    <AdminActionForm
                      action={deleteManualChapter}
                      className=""
                      successMessage="文章已删除。"
                      confirmMessage={`确认删除手册文章「${chapter.titleZh}」？`}
                    >
                      <input type="hidden" name="id" value={chapter.id} />
                      <button className="button-ghost danger-text" type="submit">
                        删除
                      </button>
                    </AdminActionForm>
                  </div>
                </div>
              </details>
            ))
          )}
          <AdminPaginationLinks
            basePath="/admin/manual"
            currentPage={currentPage}
            totalPages={totalPages}
            searchParams={{ category: filterCategoryId }}
          />
        </div>
      </section>
    </div>
  );
}
