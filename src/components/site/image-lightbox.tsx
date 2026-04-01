"use client";

import { useEffect } from "react";

type ImageLightboxProps = {
  open: boolean;
  title?: string;
  subtitle?: string;
  imageSrc?: string | null;
  imageAlt: string;
  originalHref?: string;
  onClose: () => void;
  children?: React.ReactNode;
};

export function ImageLightbox({
  open,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  originalHref,
  onClose,
  children
}: ImageLightboxProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="astro-detail-modal" role="dialog" aria-modal="true">
      <div className="astro-detail-backdrop" aria-hidden="true" onClick={onClose} />
      <div className="astro-detail-panel content-card">
        <div className="astro-detail-head">
          <div>
            {subtitle ? <p className="muted">{subtitle}</p> : null}
            {title ? <h1>{title}</h1> : null}
          </div>
          <div className="astro-detail-actions">
            {originalHref ? (
              <a className="button-secondary" href={originalHref} target="_blank" rel="noreferrer">
                查看原图
              </a>
            ) : null}
            <button className="button-ghost" type="button" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>

        {imageSrc ? (
          <div className="astro-detail-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={imageAlt} src={imageSrc} />
          </div>
        ) : null}

        {children ? <div className="astro-detail-grid">{children}</div> : null}
      </div>
    </div>
  );
}
