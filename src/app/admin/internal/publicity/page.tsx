import { PublicityWorkEditor } from "@/components/admin/publicity-work-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

import { createPublicityWork, deletePublicityWork, setPublicityWorkStatus, updatePublicityWork } from "./actions";

function formatDate(value: Date | null) {
  if (!value) return "未填写日期";
  return value.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default async function AdminPublicityPage() {
  await requireAdminSession();

  const [works, assets] = await Promise.all([
    prisma.publicityWork.findMany({
      orderBy: [{ sortOrder: "asc" }, { workDate: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 80
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
        <h2>新增宣传部作品</h2>
        <p className="muted">上传海报、传单或其他视觉作品，并填写展示日期和说明文本。</p>
        <PublicityWorkEditor action={createPublicityWork} submitLabel="新增作品" mediaOptions={mediaOptions} />
      </section>

      <section className="admin-card">
        <h2>已保存作品</h2>
        <div className="admin-stack">
          {works.length === 0 ? (
            <div className="empty-state">还没有宣传部作品。上传第一张图片后，前台会自动生成作品墙。</div>
          ) : (
            works.map((work) => (
              <details className="post-item post-item-collapsible" key={work.id}>
                <summary className="post-item-summary">
                  <div>
                    <strong>{work.title}</strong>
                    <div className="post-meta">
                      <span>{formatDate(work.workDate)}</span>
                      <span>作者：{work.author || "天小协"}</span>
                      <span>排序：{work.sortOrder}</span>
                      <span>状态：{work.status}</span>
                    </div>
                  </div>
                </summary>

                <div className="post-item-body">
                  <PublicityWorkEditor
                    action={updatePublicityWork}
                    submitLabel="保存修改"
                    mediaOptions={mediaOptions}
                    initialValues={{
                      id: work.id,
                      title: work.title,
                      author: work.author,
                      imagePath: work.imagePath,
                      descriptionZh: work.descriptionZh,
                      workDate: work.workDate,
                      sortOrder: work.sortOrder
                    }}
                  />

                  <div className="post-actions">
                    <form action={setPublicityWorkStatus}>
                      <input type="hidden" name="id" value={work.id} />
                      <input type="hidden" name="status" value="PUBLISHED" />
                      <button className="button-ghost" type="submit">
                        发布
                      </button>
                    </form>
                    <form action={setPublicityWorkStatus}>
                      <input type="hidden" name="id" value={work.id} />
                      <input type="hidden" name="status" value="DRAFT" />
                      <button className="button-ghost" type="submit">
                        设为草稿
                      </button>
                    </form>
                    <a className="button-ghost" href="/internal/publicity" target="_blank" rel="noreferrer">
                      前台查看
                    </a>
                    <form action={deletePublicityWork}>
                      <input type="hidden" name="id" value={work.id} />
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
