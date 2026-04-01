"use client";

import { useMemo, useState } from "react";

import { ImageLightbox } from "@/components/site/image-lightbox";
import { getImageVariantUrl } from "@/lib/image-variants";

type HomePhoto = {
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

function seededRandom(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number) {
  const cloned = [...items];
  const random = seededRandom(seed + items.length);
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
  }
  return cloned;
}

export function HomePhotoShowcase({
  photos
}: {
  photos: HomePhoto[];
}) {
  const [seed, setSeed] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const featured = useMemo(() => shuffle(photos, seed).slice(0, 6), [photos, seed]);
  const activePhoto = useMemo(() => featured.find((photo) => photo.id === activeId) || null, [activeId, featured]);

  if (photos.length === 0) {
    return (
      <div className="content-card">
        <strong>还没有可展示的摄影作品</strong>
        <p>发布摄影作品后，这里会自动随机展示精选照片。</p>
      </div>
    );
  }

  return (
    <div className="home-photo-showcase">
      <div className="home-photo-showcase-head">
        <p className="muted">随机展示近期摄影作品，点击图片可直接查看详情。</p>
        <button className="button-ghost" type="button" onClick={() => setSeed((value) => value + 1)}>
          刷新图片
        </button>
      </div>

      <div className="home-photo-showcase-window">
        <div className="about-gallery-masonry home-photo-showcase-masonry">
          {featured.map((photo, index) => (
            <button
              className={`about-gallery-item home-photo-showcase-item astro-height-${(index % 4) + 1}`}
              key={photo.id}
              type="button"
              onClick={() => setActiveId(photo.id)}
            >
              {photo.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={photo.title} loading="lazy" src={getImageVariantUrl(photo.imagePath, "thumb")} />
              ) : (
                <div className="astro-gallery-placeholder">
                  <span>{photo.title}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <ImageLightbox
        open={Boolean(activePhoto)}
        subtitle={activePhoto ? `天文摄影 / ${activePhoto.photographer}` : undefined}
        title={activePhoto?.title}
        imageAlt={activePhoto?.title || "摄影作品"}
        imageSrc={activePhoto ? getImageVariantUrl(activePhoto.imagePath, "thumb") : undefined}
        originalHref={activePhoto ? getImageVariantUrl(activePhoto.imagePath, "original") : undefined}
        onClose={() => setActiveId(null)}
      >
        {activePhoto ? (
          <>
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
          </>
        ) : null}
      </ImageLightbox>
    </div>
  );
}
