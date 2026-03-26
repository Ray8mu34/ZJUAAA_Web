"use client";

import { useMemo, useState } from "react";

type HomePhoto = {
  id: string;
  title: string;
  imagePath?: string | null;
};

function shuffle<T>(items: T[]) {
  const cloned = [...items];
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
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
  const featured = useMemo(() => shuffle(photos).slice(0, 6), [photos, seed]);

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
        <p className="muted">随机展示近期摄影作品，点击图片可进入摄影栏目查看更多。</p>
        <button className="button-ghost" type="button" onClick={() => setSeed((value) => value + 1)}>
          刷新图片
        </button>
      </div>

      <div className="home-photo-showcase-window">
        <div className="about-gallery-masonry home-photo-showcase-masonry">
          {featured.map((photo, index) => (
            <a
              className={`about-gallery-item home-photo-showcase-item astro-height-${(index % 4) + 1}`}
              href={`/astrophotography/${photo.id}`}
              key={photo.id}
            >
              {photo.imagePath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={photo.title} loading="lazy" src={photo.imagePath} />
              ) : (
                <div className="astro-gallery-placeholder">
                  <span>{photo.title}</span>
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
