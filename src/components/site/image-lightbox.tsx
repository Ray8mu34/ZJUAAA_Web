"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      onClose();
      setClosing(false);
    }, 220);
  }, [closing, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const { overflow } = document.body.style;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
      if (event.key === "Tab") {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, requestClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div ref={dialogRef} className={`astro-detail-modal${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label={title || imageAlt}>
      <div className="astro-detail-backdrop" aria-hidden="true" onClick={requestClose} />
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
            <button className="button-ghost" type="button" onClick={requestClose}>
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
