"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selection, setSelection] = useState<{ source: HomePhoto[]; items: HomePhoto[] } | null>(null);
  const requestRef = useRef(0);
  useEffect(() => () => { requestRef.current += 1; }, []);
  const featured = useMemo(() => selection?.source === photos ? selection.items : shuffle(photos, 0).slice(0, 6), [photos, selection]);
  const activePhoto = useMemo(() => featured.find((photo) => photo.id === activeId) || null, [activeId, featured]);

  async function refreshPhotos() {
    if (isLoading) return;
    const request = ++requestRef.current;
    const nextSeed = seed + 1;
    const nextPhotos = shuffle(photos, nextSeed).slice(0, 6);
    if (nextPhotos.length > 1 && nextPhotos.every((photo, index) => photo.id === featured[index]?.id)) {
      nextPhotos.push(nextPhotos.shift()!);
    }
    setIsLoading(true);
    setFeedback("");
    try {
      await Promise.all(nextPhotos.map((photo) => {
        if (!photo.imagePath) return Promise.resolve();
        return new Promise<void>((resolve, reject) => {
          const image = new Image();
          const timer = window.setTimeout(() => { image.src = ""; reject(new Error("timeout")); }, 12000);
          image.onload = () => { clearTimeout(timer); resolve(); };
          image.onerror = () => { clearTimeout(timer); reject(new Error("image")); };
          image.src = getImageVariantUrl(photo.imagePath, "thumb")!;
        });
      }));
      if (request !== requestRef.current) return;
      setSeed(nextSeed);
      setSelection({ source: photos, items: nextPhotos });
    } catch {
      if (request !== requestRef.current) return;
      setFeedback("图片未能加载，请重试。当前照片已保留。");
    } finally {
      if (request === requestRef.current) setIsLoading(false);
    }
  }

  if (photos.length === 0) {
    return (
      <div className="content-card">
        <h2>摄影精选</h2>
        <strong>还没有可展示的摄影作品</strong>
        <p>发布摄影作品后，这里会自动随机展示精选照片。</p>
      </div>
    );
  }

  return (
    <div className="home-photo-showcase">
      <div className="home-photo-showcase-head">
        <h2>摄影精选</h2>
        {photos.length > 1 ? <button className="home-photo-refresh" type="button" onClick={refreshPhotos} disabled={isLoading} aria-controls="home-photo-grid">
          {isLoading ? "加载中…" : "换一组"}
        </button> : null}
        <p className="home-photo-feedback" role="status">{feedback}</p>
      </div>

      <div className="home-photo-showcase-window" id="home-photo-grid" aria-busy={isLoading}>
        <div className="about-gallery-masonry home-photo-showcase-masonry" key={seed}>
          {featured.map((photo, index) => (
            <button
              className={`about-gallery-item home-photo-showcase-item astro-height-${(index % 4) + 1}`}
              data-photo-enter
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
