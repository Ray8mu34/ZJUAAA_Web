import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { requireAdminSession } from "@/lib/admin-session";

export default async function MediaUploadPage() {
  await requireAdminSession();
  return <div><AdminPageHeader eyebrow="ASSETS / MEDIA" title="上传图片" description="添加到媒体库后，可在各内容编辑器中重复使用。" backHref="/admin/media" />
    <section className="admin-editor-layout"><div className="admin-editor-main"><MediaUploadForm /></div><aside className="admin-editor-aside"><div className="admin-sticky-actions"><h3>文件说明</h3><p>支持 PNG、JPEG、GIF 与 WebP，可一次选择多个文件。用途分类只影响后续筛选，不改变文件内容。</p></div></aside></section></div>;
}
