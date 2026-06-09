"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import { getImageVariantUrl } from "@/lib/image-variants";

type PublicityShowcaseItem = {
  id: string;
  title: string;
  imagePath: string;
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
  const [selectedId, setSelectedId] = useState(works[0]?.id || "");
  const selected = useMemo(() => works.find((work) => work.id === selectedId) || works[0], [selectedId, works]);
  const center = (works.length - 1) / 2;

  if (works.length === 0) {
    return <div className="internal-empty">还没有已发布的宣传部作品。</div>;
  }

  return (
    <section className={selected ? "publicity-stage has-selection" : "publicity-stage"}>
      <div className="publicity-focus-panel">
        {selected ? (
          <>
            <div className="publicity-focus-image">
              <Image src={getImageVariantUrl(selected.imagePath, "original")} alt={selected.title} fill sizes="42vw" />
            </div>
            <div className="publicity-focus-copy">
              <span>{formatDate(selected.workDate)}</span>
              <h2>{selected.title}</h2>
              <p>{selected.descriptionZh || "这件作品还没有填写说明。"}</p>
            </div>
          </>
        ) : null}
      </div>

      <div className="publicity-deck" aria-label="宣传部作品列表">
        {works.map((work, index) => {
          const offset = index - center;
          const isSelected = work.id === selected?.id;

          return (
            <button
              key={work.id}
              className={isSelected ? "publicity-card active" : "publicity-card"}
              type="button"
              onClick={() => setSelectedId(work.id)}
              style={
                {
                  "--i": index,
                  "--x": `${offset * 54}px`,
                  "--z": `${-Math.abs(offset) * 18}px`,
                  "--r": `${offset * -4}deg`
                } as CSSProperties
              }
              aria-label={`查看 ${work.title}`}
            >
              <Image src={getImageVariantUrl(work.imagePath, "thumb")} alt={work.title} fill sizes="180px" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
