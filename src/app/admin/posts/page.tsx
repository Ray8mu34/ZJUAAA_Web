import { PostEditor } from "@/components/admin/post-editor";
import { PostOrderList } from "@/components/admin/post-order-list";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

import {
  createKnowledgePost,
  deleteKnowledgePost,
  reorderKnowledgePosts,
  setKnowledgePostStatus,
  updateKnowledgePost
} from "./actions";

export default async function AdminPostsPage() {
  await requireAdminSession();

  const [posts, assets] = await Promise.all([
    prisma.knowledgePost.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
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
            <PostOrderList
              posts={posts.map((post) => ({
                id: post.id,
                slug: post.slug,
                titleZh: post.titleZh,
                summaryZh: post.summaryZh,
                author: post.author,
                coverImagePath: post.coverImagePath,
                externalUrl: post.externalUrl,
                status: post.status,
                isFeatured: post.isFeatured
              }))}
              mediaOptions={mediaOptions}
              updateAction={updateKnowledgePost}
              statusAction={setKnowledgePostStatus}
              deleteAction={deleteKnowledgePost}
              reorderAction={reorderKnowledgePosts}
            />
          )}
        </div>
      </section>
    </div>
  );
}
