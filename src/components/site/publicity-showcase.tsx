"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
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

function formatDate(value: string | null) {
  if (!value) return "未填写日期";
  return value;
}

export function PublicityShowcase({ works }: PublicityShowcaseProps) {
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(() => works.find((work) => work.id === selectedId) || null, [selectedId, works]);
  const center = (works.length - 1) / 2;

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

        <div className="publicity-space-deck" aria-label="宣传部作品立体列表">
          {works.map((work, index) => {
            const offset = index - center;
            const layer = Math.abs(offset);

            return (
              <button
                key={work.id}
                className={work.id === selected?.id ? "publicity-space-card active" : "publicity-space-card"}
                type="button"
                onClick={() => setSelectedId(work.id)}
                style={
                  {
                    "--i": index,
                    "--x": `${offset * 78}px`,
                    "--y": `${Math.sin(index * 0.85) * 34}px`,
                    "--z": `${220 - layer * 34}px`,
                    "--ry": `${offset * -9}deg`,
                    "--rz": `${offset * 1.6}deg`
                  } as CSSProperties
                }
                aria-label={`查看 ${work.title}`}
              >
                <Image src={getImageVariantUrl(work.imagePath, "thumb")} alt={work.title} fill sizes="180px" />
              </button>
            );
          })}
        </div>

        {selected ? (
          <div className="publicity-expanded" role="dialog" aria-label={selected.title}>
            <button className="publicity-close" type="button" onClick={() => setSelectedId("")} aria-label="关闭作品说明">
              <X size={18} />
            </button>
            <div className="publicity-expanded-image">
              <Image src={getImageVariantUrl(selected.imagePath, "original")} alt={selected.title} fill sizes="42vw" />
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
          {works.map((work, index) => (
            <article
              className={index % 5 === 0 ? "publicity-portfolio-item is-wide" : "publicity-portfolio-item"}
              key={work.id}
            >
              <button type="button" onClick={() => setSelectedId(work.id)}>
                <Image src={getImageVariantUrl(work.imagePath, "thumb")} alt={work.title} fill sizes="(max-width: 720px) 90vw, 360px" />
              </button>
              <div>
                <time>{formatDate(work.workDate)}</time>
                <h3>{work.title}</h3>
                <span className="publicity-author">作者：{work.author || "天小协"}</span>
                {work.descriptionZh ? <p>{work.descriptionZh}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
