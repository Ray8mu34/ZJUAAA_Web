import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPageHeader, AdminStatus } from "@/components/admin/admin-page-header";
import { PostEditor } from "@/components/admin/post-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { formatKnowledgePublishedAtInput } from "@/lib/knowledge-post-date";
import { deleteKnowledgePost, setKnowledgePostStatus, updateKnowledgePost } from "../actions";
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession(); const { id } = await params;
  const [post, assets] = await Promise.all([prisma.knowledgePost.findUnique({ where: { id } }), prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 50 })]);
  if (!post) notFound();
  const mediaOptions = assets.map((a) => ({ id: a.id, title: a.title, filePath: a.filePath, category: a.category }));
  return <div><AdminPageHeader eyebrow="CONTENT / KNOWLEDGE" title={post.titleZh} description={`/${post.slug}`} backHref="/admin/posts"><AdminStatus status={post.status}/></AdminPageHeader><section className="admin-editor-layout"><div className="admin-editor-main"><PostEditor action={updateKnowledgePost} submitLabel="保存修改" mediaOptions={mediaOptions} initialValues={{ id: post.id, slug: post.slug, titleZh: post.titleZh, summaryZh: post.summaryZh, author: post.author, coverImagePath: post.coverImagePath, externalUrl: post.externalUrl, isFeatured: post.isFeatured, publishedAt: formatKnowledgePublishedAtInput(post.publishedAt) }}/></div><aside className="admin-editor-aside"><div className="admin-sticky-actions"><h3>发布操作</h3><AdminActionForm action={setKnowledgePostStatus} className="" successMessage="文章状态已更新。"><input type="hidden" name="id" value={post.id}/><input type="hidden" name="status" value={post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"}/><button className="button-ghost" type="submit">{post.status === "PUBLISHED" ? "转为草稿" : "发布文章"}</button></AdminActionForm>{post.externalUrl ? <Link className="button-ghost" href={post.externalUrl} target="_blank">查看原文</Link> : null}<AdminActionForm action={deleteKnowledgePost} className="" successMessage="文章已删除。" confirmMessage={`确认删除文章「${post.titleZh}」？`}><input type="hidden" name="id" value={post.id}/><button className="button-ghost danger-text" type="submit">删除文章</button></AdminActionForm></div></aside></section></div>;
}
