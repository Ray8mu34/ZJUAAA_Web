import { AstroPhotoEditor } from "@/components/admin/astro-photo-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

import { createAstroPhoto, deleteAstroPhoto, setAstroPhotoStatus, updateAstroPhoto } from "./actions";

export default async function AdminGalleryPage() {
  await requireAdminSession();

  const [photos, assets] = await Promise.all([
    prisma.astroPhoto.findMany({
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
        <h2>新增摄影作品</h2>
        <p className="muted">录入标题、摄影者、图片和设备信息后，发布即可展示在前台“天文摄影”页面。</p>
        <AstroPhotoEditor action={createAstroPhoto} submitLabel="新增摄影作品" mediaOptions={mediaOptions} />
      </section>

      <section className="admin-card">
        <h2>已保存内容</h2>
        <div className="admin-stack">
          {photos.length === 0 ? (
            <div className="empty-state">还没有摄影作品。先新增一条，保存后这里就会出现可编辑的条目。</div>
          ) : (
            photos.map((photo) => (
              <details className="post-item post-item-collapsible" key={photo.id}>
                <summary className="post-item-summary">
                  <div>
                    <strong>{photo.titleZh}</strong>
                    <div className="post-meta">
                      <span>slug: {photo.slug}</span>
                      <span>摄影者：{photo.photographer}</span>
                      <span>状态：{photo.status}</span>
                    </div>
                  </div>
                </summary>

                <div className="post-item-body">
                  <AstroPhotoEditor
                    action={updateAstroPhoto}
                    submitLabel="保存修改"
                    mediaOptions={mediaOptions}
                    initialValues={{
                      id: photo.id,
                      slug: photo.slug,
                      titleZh: photo.titleZh,
                      photographer: photo.photographer,
                      imagePath: photo.imagePath,
                      descriptionZh: photo.descriptionZh,
                      skyRegionZh: photo.skyRegionZh,
                      locationZh: photo.locationZh,
                      equipmentMainLens: photo.equipmentMainLens,
                      equipmentCamera: photo.equipmentCamera,
                      equipmentMount: photo.equipmentMount,
                      equipmentFilter: photo.equipmentFilter,
                      equipmentSoftware: photo.equipmentSoftware
                    }}
                  />

                  <div className="post-actions">
                    <form action={setAstroPhotoStatus}>
                      <input type="hidden" name="id" value={photo.id} />
                      <input type="hidden" name="status" value="PUBLISHED" />
                      <button className="button-ghost" type="submit">
                        发布
                      </button>
                    </form>
                    <form action={setAstroPhotoStatus}>
                      <input type="hidden" name="id" value={photo.id} />
                      <input type="hidden" name="status" value="DRAFT" />
                      <button className="button-ghost" type="submit">
                        设为草稿
                      </button>
                    </form>
                    <a className="button-ghost" href={`/astrophotography/${photo.id}`} target="_blank" rel="noreferrer">
                      前台查看
                    </a>
                    <form action={deleteAstroPhoto}>
                      <input type="hidden" name="id" value={photo.id} />
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
