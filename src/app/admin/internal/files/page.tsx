import { InternalFileEditor } from "@/components/admin/internal-file-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

import { createInternalFile, deleteInternalFile, setInternalFileStatus, updateInternalFile } from "./actions";

function formatFileSize(size: number) {
  if (size >= 1024 * 1024 * 1024) return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

export default async function AdminInternalFilesPage() {
  await requireAdminSession();

  const files = await prisma.internalFile.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h2>新增内部资料</h2>
        <p className="muted">上传后会出现在前台“内部资料 / 文件下载”页面。资料下载需要通过内部资料账号验证。</p>
        <InternalFileEditor action={createInternalFile} submitLabel="新增资料" />
      </section>

      <section className="admin-card">
        <h2>已保存资料</h2>
        <div className="admin-stack">
          {files.length === 0 ? (
            <div className="empty-state">还没有内部资料。先上传一份文件，保存后这里就会出现可编辑的条目。</div>
          ) : (
            files.map((file) => (
              <details className="post-item post-item-collapsible" key={file.id}>
                <summary className="post-item-summary">
                  <div>
                    <strong>{file.title}</strong>
                    <div className="post-meta">
                      <span>{file.category || "未分类"}</span>
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>状态：{file.status}</span>
                    </div>
                  </div>
                </summary>

                <div className="post-item-body">
                  <InternalFileEditor
                    action={updateInternalFile}
                    submitLabel="保存修改"
                    initialValues={{
                      id: file.id,
                      title: file.title,
                      description: file.description,
                      category: file.category,
                      sortOrder: file.sortOrder
                    }}
                  />

                  <div className="post-actions">
                    <form action={setInternalFileStatus}>
                      <input type="hidden" name="id" value={file.id} />
                      <input type="hidden" name="status" value="PUBLISHED" />
                      <button className="button-ghost" type="submit">
                        发布
                      </button>
                    </form>
                    <form action={setInternalFileStatus}>
                      <input type="hidden" name="id" value={file.id} />
                      <input type="hidden" name="status" value="DRAFT" />
                      <button className="button-ghost" type="submit">
                        设为草稿
                      </button>
                    </form>
                    <form action={deleteInternalFile}>
                      <input type="hidden" name="id" value={file.id} />
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
