import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PostEditor } from "@/components/admin/post-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { createKnowledgePost } from "../actions";
export default async function NewPostPage() {
  await requireAdminSession();
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const mediaOptions = assets.map((a) => ({ id: a.id, title: a.title, filePath: a.filePath, category: a.category }));
  return <div><AdminPageHeader eyebrow="CONTENT / KNOWLEDGE" title="新建科普文章" description="创建后可返回列表发布或继续编辑。" backHref="/admin/posts"/><section className="admin-editor-layout"><div className="admin-editor-main"><PostEditor action={createKnowledgePost} submitLabel="保存文章" mediaOptions={mediaOptions}/></div><aside className="admin-editor-aside"><div className="admin-sticky-actions"><h3>编辑提示</h3><p>标题与作者为必填项。原始发布时间留空时，将在首次发布时自动记录。</p></div></aside></section></div>;
}
