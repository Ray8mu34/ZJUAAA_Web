import { AdminMediaGrid } from "@/components/admin/admin-media-grid";
import { prisma } from "@/lib/db";

import { uploadMediaAsset } from "./actions";

const categoryLabels: Record<string, string> = {
  shared: "通用",
  site: "首页 / 页脚",
  knowledge: "知识科普",
  manual: "天文手册",
  activity: "社团活动",
  gallery: "天文摄影",
  internal: "内建"
};

export default async function AdminMediaPage() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h2>上传图片</h2>
        <p className="muted">
          媒体库供全站复用。上传时选择用途分类，后续在首页、手册、活动、摄影等模块里会更容易筛选。单张图片目前支持到
          50MB。
        </p>

        <form action={uploadMediaAsset} className="admin-form">
          <div className="admin-form-grid">
            <label>
              <span>图片标题</span>
              <input name="title" type="text" placeholder="例如：社团合照、活动海报、月球特写" />
            </label>
            <label>
              <span>图片文件</span>
              <input className="file-input" name="files" type="file" accept="image/*" multiple required />
            </label>
          </div>

          <div className="admin-form-grid">
            <label>
              <span>用途分类</span>
              <select className="admin-select" name="category" defaultValue="shared">
                <option value="shared">通用</option>
                <option value="site">首页 / 页脚</option>
                <option value="knowledge">知识科普</option>
                <option value="manual">天文手册</option>
                <option value="activity">社团活动</option>
                <option value="gallery">天文摄影</option>
                <option value="internal">内建</option>
              </select>
            </label>
            <label>
              <span>中文替代标题</span>
              <input name="altZh" type="text" placeholder="用于无障碍和图片说明，可不填" />
            </label>
          </div>

          <button className="button-link" type="submit">
            上传图片
          </button>
        </form>
      </section>

      <section className="admin-card">
        <h2>现有图片</h2>
        {assets.length === 0 ? (
          <div className="empty-state">媒体库里还没有图片。先上传后，就可以在各个内容模块里直接选图了。</div>
        ) : (
          <AdminMediaGrid
            assets={assets.map((asset) => ({
              id: asset.id,
              title: asset.title,
              filePath: asset.filePath,
              mimeType: asset.mimeType,
              category: asset.category
            }))}
            categoryLabels={categoryLabels}
          />
        )}
      </section>
    </div>
  );
}
