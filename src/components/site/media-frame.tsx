import Image from "next/image";

type MediaFrameProps = {
  src?: string | null;
  alt: string;
  className?: string;
  label?: string;
};

export function MediaFrame({ src, alt, className = "", label = "图片预览" }: MediaFrameProps) {
  if (!src) {
    return (
      <div className={`media-frame placeholder ${className}`}>
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className={`media-frame ${className}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 980px) 100vw, 33vw" />
    </div>
  );
}
