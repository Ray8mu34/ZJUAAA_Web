import Image from "next/image";

import { getImageVariantUrl } from "@/lib/image-variants";

type MediaFrameProps = {
  src?: string | null;
  alt: string;
  className?: string;
  label?: string;
  sizes?: string;
};

export function MediaFrame({ src, alt, className = "", label = "图片预览", sizes = "(max-width: 980px) 100vw, 33vw" }: MediaFrameProps) {
  if (!src) {
    return (
      <div className={`media-frame placeholder ${className}`}>
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className={`media-frame ${className}`}>
      <Image src={getImageVariantUrl(src, "thumb")} alt={alt} fill sizes={sizes} />
    </div>
  );
}
