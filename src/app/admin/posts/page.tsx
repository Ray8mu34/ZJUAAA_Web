import { PostEditor } from "@/components/admin/post-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

import { createKnowledgePost, deleteKnowledgePost, setKnowledgePostStatus, updateKnowledgePost } from "./actions";

export default async function AdminPostsPage() {
  await requireAdminSession();

  const [posts, assets] = await Promise.all([
    prisma.knowledgePost.findMany({
      orderBy: { updatedAt: "desc" }
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
        <h2>新增科普文章</h2>
        <p className="muted">录入文章标题、作者、封面和公众号原文链接后，发布即可在前台展示。</p>
        <PostEditor action={createKnowledgePost} submitLabel="新增科普文章" mediaOptions={mediaOptions} />
      </section>

      <section className="admin-card">
        <h2>已有文章</h2>
        <div className="admin-stack">
          {posts.length === 0 ? (
            <div className="empty-state">还没有科普文章。先新增一篇内容再回来管理。</div>
          ) : (
            posts.map((post) => (
              <details className="post-item post-item-collapsible" key={post.id}>
                <summary className="post-item-summary">
                  <div>
                    <strong>{post.titleZh}</strong>
                    <div className="post-meta">
                      <span>slug: {post.slug}</span>
                      <span>作者：{post.author}</span>
                      <span>状态：{post.status}</span>
                      {post.isFeatured ? <span>首页精选</span> : null}
                    </div>
                  </div>
                </summary>

                <div className="post-item-body">
                  <PostEditor
                    action={updateKnowledgePost}
                    submitLabel="保存修改"
                    mediaOptions={mediaOptions}
                    initialValues={{
                      id: post.id,
                      slug: post.slug,
                      titleZh: post.titleZh,
                      summaryZh: post.summaryZh,
                      author: post.author,
                      coverImagePath: post.coverImagePath,
                      externalUrl: post.externalUrl,
                      isFeatured: post.isFeatured
                    }}
                  />

                  <div className="post-actions">
                    <form action={setKnowledgePostStatus}>
                      <input type="hidden" name="id" value={post.id} />
                      <input type="hidden" name="status" value="PUBLISHED" />
                      <button className="button-ghost" type="submit">
                        发布
                      </button>
                    </form>
                    <form action={setKnowledgePostStatus}>
                      <input type="hidden" name="id" value={post.id} />
                      <input type="hidden" name="status" value="DRAFT" />
                      <button className="button-ghost" type="submit">
                        转为草稿
                      </button>
                    </form>
                    <a className="button-ghost" href={post.externalUrl || "#"} target="_blank" rel="noreferrer">
                      查看外链
                    </a>
                    <form action={deleteKnowledgePost}>
                      <input type="hidden" name="id" value={post.id} />
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
