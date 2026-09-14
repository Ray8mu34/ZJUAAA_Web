import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { requireAdminSession } from "@/lib/admin-session";

export default async function MediaUploadPage() {
  await requireAdminSession();

  return (
    <div>
      <AdminPageHeader
        eyebrow="ASSETS / MEDIA"
        title="上传图片"
        description="添加到媒体库后，可在各内容编辑器中重复使用。"
        backHref="/admin/media"
      />
      <section className="admin-editor-layout">
        <div className="admin-editor-main">
          <MediaUploadForm />
        </div>
        <aside className="admin-editor-aside">
          <div className="admin-sticky-actions">
            <h3>文件说明</h3>
            <ul className="admin-help-list">
              <li>支持 PNG、JPEG、GIF 与 WebP 图片。</li>
              <li id="media-upload-limit">服务器请求上限为 512 MB；多文件合计请预留少量请求开销。</li>
              <li>支持一次选择多个文件，接近上限时建议分批上传。</li>
              <li>用途分类仅用于后续筛选，不会改变图片内容。</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
