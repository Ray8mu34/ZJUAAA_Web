import Link from "next/link";

import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPaginationLinks } from "@/components/admin/admin-pagination-links";
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

const PAGE_SIZE = 20;

export default async function AdminPostsPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; page?: string }>;
}) {
  await requireAdminSession();
  const { mode, page } = await searchParams;
  const isSortMode = mode === "sort";
  const currentPage = Math.max(1, Number.parseInt(String(page || "1"), 10) || 1);

  const [posts, totalPosts, assets] = await Promise.all([
    prisma.knowledgePost.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      ...(isSortMode
        ? {}
        : {
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE
          })
    }),
    prisma.knowledgePost.count(),
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
  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h2>新增科普文章</h2>
        <p className="muted">录入文章标题、作者、封面和公众号原文链接后，发布即可在前台展示。</p>
        <PostEditor action={createKnowledgePost} submitLabel="新增科普文章" mediaOptions={mediaOptions} />
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>{isSortMode ? "文章排序模式" : "已有文章"}</h2>
            <p className="muted">{isSortMode ? "排序模式会加载全部文章，用于拖拽调整展示优先级。" : "默认分页编辑文章，避免列表过长时后台变慢。"}</p>
          </div>
          <div className="admin-card-head-actions">
            <Link className={`button-ghost ${!isSortMode ? "active" : ""}`} href="/admin/posts">
              编辑模式
            </Link>
            <Link className={`button-ghost ${isSortMode ? "active" : ""}`} href="/admin/posts?mode=sort">
              排序模式
            </Link>
          </div>
        </div>
        <div className="admin-stack">
          {posts.length === 0 ? (
            <div className="empty-state">还没有科普文章。先新增一篇内容再回来管理。</div>
          ) : isSortMode ? (
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
          ) : (
            <>
              {posts.map((post) => (
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
                      <AdminActionForm action={setKnowledgePostStatus} className="" successMessage="文章已发布。">
                        <input type="hidden" name="id" value={post.id} />
                        <input type="hidden" name="status" value="PUBLISHED" />
                        <button className="button-ghost" type="submit">
                          发布
                        </button>
                      </AdminActionForm>
                      <AdminActionForm action={setKnowledgePostStatus} className="" successMessage="文章已转为草稿。">
                        <input type="hidden" name="id" value={post.id} />
                        <input type="hidden" name="status" value="DRAFT" />
                        <button className="button-ghost" type="submit">
                          转为草稿
                        </button>
                      </AdminActionForm>
                      <a className="button-ghost" href={post.externalUrl || "#"} target="_blank" rel="noreferrer">
                        查看外链
                      </a>
                      <AdminActionForm
                        action={deleteKnowledgePost}
                        className=""
                        successMessage="文章已删除。"
                        confirmMessage={`确认删除文章「${post.titleZh}」？`}
                      >
                        <input type="hidden" name="id" value={post.id} />
                        <button className="button-ghost danger-text" type="submit">
                          删除
                        </button>
                      </AdminActionForm>
                    </div>
                  </div>
                </details>
              ))}
              <AdminPaginationLinks basePath="/admin/posts" currentPage={currentPage} totalPages={totalPages} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
