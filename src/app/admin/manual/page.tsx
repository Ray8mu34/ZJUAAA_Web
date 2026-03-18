import { ManualEditor } from "@/components/admin/manual-editor";
import { prisma } from "@/lib/db";

import { createManualChapter, deleteManualChapter, setManualChapterStatus, updateManualChapter } from "./actions";

export default async function AdminManualPage() {
  const [chapters, assets] = await Promise.all([
    prisma.manualChapter.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    }),
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

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h2>新增手册章节</h2>
        <p className="muted">手册用于站内阅读和长期保存。支持 Markdown 正文、封面图、作者、简介和插图助手。</p>
        <ManualEditor action={createManualChapter} submitLabel="新增手册章节" mediaOptions={mediaOptions} />
      </section>

      <section className="admin-card">
        <h2>已保存内容</h2>
        <div className="admin-stack">
          {chapters.length === 0 ? (
            <div className="empty-state">还没有手册章节。先新增一篇，保存后这里就会出现可编辑的条目。</div>
          ) : (
            chapters.map((chapter) => (
              <details className="post-item post-item-collapsible" key={chapter.id}>
                <summary className="post-item-summary">
                  <div>
                    <strong>
                      {chapter.chapterNo} {chapter.titleZh}
                    </strong>
                    <div className="post-meta">
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
                    initialValues={{
                      id: chapter.id,
                      slug: chapter.slug,
                      chapterNo: chapter.chapterNo,
                      titleZh: chapter.titleZh,
                      author: chapter.author,
                      summaryZh: chapter.summaryZh,
                      sortOrder: chapter.sortOrder,
                      coverImagePath: chapter.coverImagePath,
                      markdownZh: chapter.markdownZh
                    }}
                  />

                  <div className="post-actions">
                    <form action={setManualChapterStatus}>
                      <input type="hidden" name="id" value={chapter.id} />
                      <input type="hidden" name="status" value="PUBLISHED" />
                      <button className="button-ghost" type="submit">
                        发布
                      </button>
                    </form>
                    <form action={setManualChapterStatus}>
                      <input type="hidden" name="id" value={chapter.id} />
                      <input type="hidden" name="status" value="DRAFT" />
                      <button className="button-ghost" type="submit">
                        设为草稿
                      </button>
                    </form>
                    <a className="button-ghost" href={`/manual/${chapter.id}`} target="_blank" rel="noreferrer">
                      前台查看
                    </a>
                    <form action={deleteManualChapter}>
                      <input type="hidden" name="id" value={chapter.id} />
                      <button className="button-ghost danger-text" type="submit">
                        删除
                      </button>
                    </form>
                  </div>
                </div>
              </details>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
