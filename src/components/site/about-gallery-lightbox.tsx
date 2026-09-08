"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { MouseEvent, useCallback, useEffect, useRef, useState } from "react";
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
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeImage = activeIndex === null ? null : images[activeIndex] || null;

  const showPrevious = useCallback(() => {
    setActiveIndex((index) => (index === null ? null : (index - 1 + images.length) % images.length));
  }, [images.length]);

  const showNext = useCallback(() => {
    setActiveIndex((index) => (index === null ? null : (index + 1) % images.length));
  }, [images.length]);

  const closeLightbox = useCallback(() => {
    if (closing) return;
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setActiveIndex(null);
      setClosing(false);
    }, 220);
  }, [closing]);

  useEffect(() => {
    setMounted(true);

    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
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
        closeLightbox();
      } else if (event.key === "ArrowLeft" && images.length > 1) {
        showPrevious();
      } else if (event.key === "ArrowRight" && images.length > 1) {
        showNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, closeLightbox, images.length, showNext, showPrevious]);

  const modal =
    mounted && activeImage
      ? createPortal(
          <div className={`about-lightbox-modal${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true">
            <div className="about-lightbox-backdrop" aria-hidden="true" onClick={closeLightbox} />
            <div className="about-lightbox-panel">
              <button aria-label="关闭大图" className="about-lightbox-close" type="button" onClick={closeLightbox}>
                <X aria-hidden="true" size={22} />
              </button>
              <div className="about-lightbox-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={activeImage.alt} src={getImageVariantUrl(activeImage.src, "original")} />
              </div>
              {images.length > 1 ? (
                <>
                  <button aria-label="上一张照片" className="about-lightbox-step is-previous" type="button" onClick={showPrevious}>
                    <ChevronLeft aria-hidden="true" size={28} />
                  </button>
                  <button aria-label="下一张照片" className="about-lightbox-step is-next" type="button" onClick={showNext}>
                    <ChevronRight aria-hidden="true" size={28} />
                  </button>
                </>
              ) : null}
              <div className="about-lightbox-footer">
                <span>{activeIndex === null ? "" : `${activeIndex + 1} / ${images.length}`}</span>
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
      <div className="about-gallery-masonry">
        {images.map((image, index) => (
          <button
            aria-label={`查看大图：${image.alt}`}
            className="about-gallery-item"
            key={`${image.src}-${index}`}
            type="button"
            onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.preventDefault()}
            onClick={() => {
              setClosing(false);
              setActiveIndex(index);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={image.alt} loading="lazy" src={getImageVariantUrl(image.src, "thumb")} />
          </button>
        ))}
      </div>

      {modal}
    </>
  );
}
