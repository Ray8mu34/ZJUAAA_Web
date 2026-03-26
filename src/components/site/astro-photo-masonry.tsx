"use client";

import { useMemo, useState } from "react";

type AstroPhotoItem = {
  id: string;
  title: string;
  description: string;
  photographer: string;
  skyRegion?: string | null;
  location?: string | null;
  mainLens?: string | null;
  camera?: string | null;
  mount?: string | null;
  filter?: string | null;
  software?: string | null;
  imagePath?: string | null;
};

const INITIAL_COUNT = 15;
const LOAD_STEP = 9;

export function AstroPhotoMasonry({
  photos
}: {
  photos: AstroPhotoItem[];
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [activeId, setActiveId] = useState<string | null>(null);
  const visiblePhotos = useMemo(() => photos.slice(0, visibleCount), [photos, visibleCount]);
  const activePhoto = useMemo(() => photos.find((photo) => photo.id === activeId) || null, [activeId, photos]);

  if (photos.length === 0) {
    return (
      <div className="cards-grid">
        <article className="content-card">
          <strong>还没有已发布作品</strong>
          <p>可以先去后台录入摄影作品并发布。</p>
        </article>
      </div>
    );
  }

  return (
    <>
      <div className="astro-wall">
        <div className="about-gallery-masonry astro-gallery-masonry">
          {visiblePhotos.map((photo, index) => (
            <button
              className={`about-gallery-item astro-gallery-item astro-height-${(index % 4) + 1}`}
              key={photo.id}
              type="button"
              onClick={() => setActiveId(photo.id)}
            >
              {photo.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={photo.title} loading="lazy" src={photo.imagePath} />
              ) : (
                <div className="astro-gallery-placeholder">
                  <span>{photo.title}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {visibleCount < photos.length ? (
          <div className="astro-masonry-footer">
            <button className="button-ghost" type="button" onClick={() => setVisibleCount((count) => count + LOAD_STEP)}>
              加载更多作品
            </button>
          </div>
        ) : null}
      </div>

      {activePhoto ? (
        <div className="astro-detail-modal" role="dialog" aria-modal="true">
          <button className="astro-detail-backdrop" type="button" aria-label="关闭详情" onClick={() => setActiveId(null)} />
          <div className="astro-detail-panel content-card">
            <div className="astro-detail-head">
              <div>
                <p className="muted">天文摄影 / {activePhoto.photographer}</p>
                <h1>{activePhoto.title}</h1>
              </div>
              <button className="button-ghost" type="button" onClick={() => setActiveId(null)}>
                关闭
              </button>
            </div>

            {activePhoto.imagePath ? (
              <div className="astro-detail-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={activePhoto.title} src={activePhoto.imagePath} />
              </div>
            ) : null}

            <div className="astro-detail-grid">
              <article className="content-card">
                <strong>作品简介</strong>
                <p>{activePhoto.description || "暂无作品简介。"}</p>
              </article>

              <article className="content-card">
                <strong>拍摄信息</strong>
                <p>拍摄者：{activePhoto.photographer}</p>
                <p>天区 / 目标：{activePhoto.skyRegion || "暂未填写"}</p>
                <p>拍摄地点：{activePhoto.location || "暂未填写"}</p>
              </article>

              <article className="content-card">
                <strong>器材信息</strong>
                <p>主镜 / 镜头：{activePhoto.mainLens || "暂未填写"}</p>
                <p>相机：{activePhoto.camera || "暂未填写"}</p>
                <p>赤道仪 / 云台：{activePhoto.mount || "暂未填写"}</p>
              </article>

              <article className="content-card">
                <strong>处理流程</strong>
                <p>滤镜：{activePhoto.filter || "暂未填写"}</p>
                <p>后期软件：{activePhoto.software || "暂未填写"}</p>
              </article>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
