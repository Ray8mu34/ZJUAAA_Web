"use client";

import { useEffect, useMemo, useState } from "react";

type TocItem = {
  id: string;
  text: string;
  level: number;
};

export function ManualToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  const headingIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    if (headingIds.length === 0) return;

    const headings = headingIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-90px 0px -65% 0px",
        threshold: [0, 0.2, 0.6, 1]
      }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
      observer.disconnect();
    };
  }, [headingIds]);

  return (
    <div className="manual-toc">
      <strong>本章目录</strong>
      <div className="manual-toc-list">
        {items.map((item) => (
          <a
            key={`${item.id}-${item.level}`}
            href={`#${item.id}`}
            className={[
              "manual-toc-link",
              item.level >= 3 ? "level-3" : "",
              item.id === activeId ? "active" : ""
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {item.text}
          </a>
        ))}
      </div>
    </div>
  );
}
