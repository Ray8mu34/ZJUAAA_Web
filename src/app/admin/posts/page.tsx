import Link from "next/link";
import { AdminPaginationLinks } from "@/components/admin/admin-pagination-links";
import { AdminPageHeader, AdminStatus } from "@/components/admin/admin-page-header";
import { PostOrderList } from "@/components/admin/post-order-list";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { formatKnowledgePublishedAtInput } from "@/lib/knowledge-post-date";
import { deleteKnowledgePost, reorderKnowledgePosts, setKnowledgePostStatus, updateKnowledgePost } from "./actions";

const PAGE_SIZE = 20;
export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ mode?: string; page?: string }> }) {
  await requireAdminSession();
  const { mode, page } = await searchParams;
  const isSortMode = mode === "sort";
  const currentPage = Math.max(1, Number.parseInt(String(page || "1"), 10) || 1);
  const [posts, totalPosts, assets] = await Promise.all([
    prisma.knowledgePost.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], ...(isSortMode ? {} : { skip: (currentPage - 1) * PAGE_SIZE, take: PAGE_SIZE }) }),
    prisma.knowledgePost.count(),
    isSortMode ? prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 50 }) : Promise.resolve([])
  ]);
  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));
  const mediaOptions = assets.map((asset) => ({ id: asset.id, title: asset.title, filePath: asset.filePath, category: asset.category }));
  return <div className="admin-stack">
    <AdminPageHeader eyebrow="CONTENT / KNOWLEDGE" title="科普文章" description={`共 ${totalPosts} 篇内容。打开条目进入独立编辑页。`} primaryHref="/admin/posts/new" primaryLabel="新建文章">
      <Link className={`button-ghost ${isSortMode ? "" : "active"}`} href="/admin/posts">内容列表</Link>
      <Link className={`button-ghost ${isSortMode ? "active" : ""}`} href="/admin/posts?mode=sort">调整排序</Link>
    </AdminPageHeader>
    <section className="admin-card">
      {posts.length === 0 ? <div className="empty-state">暂无科普文章。</div> : isSortMode ? <PostOrderList
        posts={posts.map((post) => ({ id: post.id, slug: post.slug, titleZh: post.titleZh, summaryZh: post.summaryZh, author: post.author, coverImagePath: post.coverImagePath, externalUrl: post.externalUrl, status: post.status, isFeatured: post.isFeatured, publishedAt: formatKnowledgePublishedAtInput(post.publishedAt) }))}
        mediaOptions={mediaOptions} updateAction={updateKnowledgePost} statusAction={setKnowledgePostStatus} deleteAction={deleteKnowledgePost} reorderAction={reorderKnowledgePosts}
      /> : <div className="admin-data-list">
        <div className="admin-data-row admin-data-row-header"><span>文章</span><span>作者</span><span>状态</span><span>操作</span></div>
        {posts.map((post) => <Link className="admin-data-row" href={`/admin/posts/${post.id}`} key={post.id}>
          <span className="admin-data-title"><strong>{post.titleZh}</strong><span>{post.slug}{post.isFeatured ? " · 首页精选" : ""}</span></span>
          <span className="admin-data-cell">{post.author || "—"}</span><AdminStatus status={post.status}/><span className="admin-data-action">编辑 →</span>
        </Link>)}
      </div>}
      {!isSortMode ? <AdminPaginationLinks basePath="/admin/posts" currentPage={currentPage} totalPages={totalPages}/> : null}
    </section>
  </div>;
}
