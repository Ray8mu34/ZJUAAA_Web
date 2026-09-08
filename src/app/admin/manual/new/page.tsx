import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ManualEditor } from "@/components/admin/manual-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { createManualChapter } from "../actions";
export default async function NewManualPage() { await requireAdminSession(); const [categories, assets] = await Promise.all([prisma.manualCategory.findMany({ orderBy: { sortOrder: "asc" } }), prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 50 })]);
  return <div><AdminPageHeader eyebrow="CONTENT / MANUAL" title="新建手册章节" description="正文编辑区支持 Markdown、拖拽与粘贴图片。" backHref="/admin/manual"/><section className="admin-editor-layout"><div className="admin-editor-main"><ManualEditor action={createManualChapter} submitLabel="保存章节" categories={categories.map(c=>({id:c.id,slug:c.slug,titleZh:c.titleZh}))} mediaOptions={assets.map(a=>({id:a.id,title:a.title,filePath:a.filePath,category:a.category}))}/></div><aside className="admin-editor-aside"><div className="admin-sticky-actions"><h3>章节组织</h3><p>排序值越小越靠前；未填写时会按栏目中的现有章节自动递增。</p></div></aside></section></div>;
}
