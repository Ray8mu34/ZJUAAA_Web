"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import { getImageVariantUrl } from "@/lib/image-variants";

type PublicityShowcaseItem = {
  id: string;
  title: string;
  imagePath: string;
  author: string;
  descriptionZh: string | null;
  workDate: string | null;
};

type PublicityShowcaseProps = {
  works: PublicityShowcaseItem[];
};

type TimelineCardProps = {
  work: PublicityShowcaseItem;
  index: number;
  onSelect: (id: string) => void;
};

function formatDate(value: string | null) {
  if (!value) return "未填写日期";
  return value;
}

function PublicityTimelineCard({ work, index, onSelect }: TimelineCardProps) {
  const imageButtonRef = useRef<HTMLButtonElement | null>(null);
  const [imageHeight, setImageHeight] = useState(420);

  useEffect(() => {
    const element = imageButtonRef.current;
    if (!element) return;

    const updateHeight = () => {
      const nextHeight = element.getBoundingClientRect().height;
      if (nextHeight > 0) {
        setImageHeight(nextHeight);
      }
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [work.imagePath]);

  return (
    <article
      className={index % 2 === 0 ? "publicity-timeline-card" : "publicity-timeline-card is-reverse"}
      style={
        {
          "--timeline-image-height": `${imageHeight}px`,
          "--timeline-card-max-height": `${Math.round(imageHeight * 1.5)}px`
        } as CSSProperties
      }
    >
      <button ref={imageButtonRef} type="button" onClick={() => onSelect(work.id)}>
        <img src={getImageVariantUrl(work.imagePath, "thumb")} alt={work.title} />
      </button>
      <div>
        <time>{formatDate(work.workDate)}</time>
        <h3>{work.title}</h3>
        <span className="publicity-author">作者：{work.author || "天小协"}</span>
        {work.descriptionZh ? <p>{work.descriptionZh}</p> : null}
      </div>
    </article>
  );
}

export function PublicityShowcase({ works }: PublicityShowcaseProps) {
  const [selectedId, setSelectedId] = useState("");
  const orderedWorks = useMemo(() => {
    return [...works].sort((a, b) => {
      const left = a.workDate ? new Date(a.workDate).getTime() : 0;
      const right = b.workDate ? new Date(b.workDate).getTime() : 0;
      return left - right;
    });
  }, [works]);
  const selected = useMemo(() => orderedWorks.find((work) => work.id === selectedId) || null, [orderedWorks, selectedId]);
  const center = (orderedWorks.length - 1) / 2;
  const count = orderedWorks.length;
  const cardWidth = count <= 2 ? 196 : count <= 4 ? 158 : 118;
  const xStep = count <= 2 ? 200 : count <= 4 ? 128 : 48;
  const yStep = count <= 2 ? 104 : count <= 4 ? 68 : 20;
  const zStep = count <= 2 ? 300 : count <= 4 ? 160 : 44;
  const deckShift = count <= 2 ? "-2vw" : count <= 4 ? "-4vw" : "-7vw";

  if (works.length === 0) {
    return <div className="internal-empty">还没有已发布的宣传部作品。</div>;
  }

  return (
    <>
      <section className={selected ? "publicity-gallery-hero is-open" : "publicity-gallery-hero"}>
        <div className="publicity-hero-copy">
          <span className="internal-kicker">Publicity Works</span>
          <h1>宣传部作品</h1>
          <p>社团视觉作品墙。点击任意作品，展开日期和说明。</p>
        </div>

        <div
          className="publicity-space-deck"
          aria-label="宣传部作品立体列表"
          style={{ "--card-w": `${cardWidth}px`, "--deck-shift": deckShift } as CSSProperties}
        >
          <div className="publicity-space-scene">
            {orderedWorks.map((work, index) => {
              const offset = index - center;
              const wave = count <= 2 ? 0 : Math.sin(index * 1.1);

              return (
                <button
                  key={work.id}
                  className={work.id === selected?.id ? "publicity-space-card active" : "publicity-space-card"}
                  type="button"
                  style={
                    {
                      "--i": index,
                      "--x": `${offset * xStep}px`,
                      "--y": `${offset * yStep + wave * 4}px`,
                      "--z": `${offset * zStep}px`,
                      "--ry": `${16 + wave * 0.3}deg`,
                      "--rz": `${-2 + wave * 0.18}deg`,
                      "--stack": index
                    } as CSSProperties
                  }
                  aria-label={`查看 ${work.title}`}
                >
                  <span className="publicity-space-card-inner" onClick={() => setSelectedId(work.id)}>
                    <Image src={getImageVariantUrl(work.imagePath, "thumb")} alt={work.title} fill sizes="220px" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selected ? (
          <div className="publicity-expanded" role="dialog" aria-label={selected.title}>
            <button className="publicity-close" type="button" onClick={() => setSelectedId("")} aria-label="关闭作品说明">
              <X size={18} />
            </button>
            <div className="publicity-expanded-image">
              <img src={getImageVariantUrl(selected.imagePath, "original")} alt={selected.title} />
            </div>
            <div className="publicity-expanded-copy">
              <span>{formatDate(selected.workDate)}</span>
              <h2>{selected.title}</h2>
              <strong>作者：{selected.author || "天小协"}</strong>
              <p>{selected.descriptionZh || "这件作品还没有填写说明。"}</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="publicity-portfolio">
        <div className="publicity-portfolio-head">
          <span className="internal-kicker">Archive</span>
          <h2>作品时间线</h2>
        </div>

        <div className="publicity-portfolio-grid">
          {orderedWorks.map((work, index) => (
            <PublicityTimelineCard key={work.id} work={work} index={index} onSelect={setSelectedId} />
          ))}
        </div>
      </section>
    </>
  );
}
