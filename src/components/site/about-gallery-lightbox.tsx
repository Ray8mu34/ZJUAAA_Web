"use client";

import { MouseEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { getImageVariantUrl } from "@/lib/image-variants";

type AboutGalleryLightboxProps = {
  images: Array<{
    src: string;
    alt: string;
  }>;
};

export function AboutGalleryLightbox({ images }: AboutGalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const activeImage = activeIndex === null ? null : images[activeIndex] || null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const { overflow } = document.body.style;
    const activeElement = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    activeElement?.blur();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex]);

  const modal =
    mounted && activeImage
      ? createPortal(
          <div className="about-lightbox-modal" role="dialog" aria-modal="true">
            <div className="about-lightbox-backdrop" aria-hidden="true" onClick={() => setActiveIndex(null)} />
            <div className="about-lightbox-panel">
              <button className="about-lightbox-close" type="button" onClick={() => setActiveIndex(null)}>
                关闭
              </button>
              <div className="about-lightbox-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={activeImage.alt} src={getImageVariantUrl(activeImage.src, "thumb")} />
              </div>
              <div className="about-lightbox-actions">
                <a className="button-secondary" href={getImageVariantUrl(activeImage.src, "original")} target="_blank" rel="noreferrer">
                  查看原图
                </a>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="about-gallery-window">
        <div className="about-gallery-masonry">
          {images.map((image, index) => (
            <button
              className="about-gallery-item"
              key={`${image.src}-${index}`}
              type="button"
              onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.preventDefault()}
              onClick={() => setActiveIndex(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={image.alt} loading="lazy" src={getImageVariantUrl(image.src, "thumb")} />
            </button>
          ))}
        </div>
      </div>

      {modal}
    </>
  );
}
