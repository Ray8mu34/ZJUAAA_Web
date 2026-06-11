"use client";

import { RefreshCw } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

type Story = {
  id: string;
  title: string | null;
  content: string;
  source: string | null;
};

type InternalStoryCloudProps = {
  stories: Story[];
};

const slots = [
  { x: 7, y: 10, size: "lg", rotate: -4 },
  { x: 42, y: 7, size: "md", rotate: 2 },
  { x: 68, y: 14, size: "sm", rotate: -2 },
  { x: 18, y: 39, size: "sm", rotate: 3 },
  { x: 50, y: 35, size: "xl", rotate: -1 },
  { x: 74, y: 46, size: "md", rotate: 4 },
  { x: 9, y: 68, size: "md", rotate: 2 },
  { x: 36, y: 70, size: "sm", rotate: -3 },
  { x: 63, y: 72, size: "lg", rotate: 1 }
];

function shuffleStories(stories: Story[], seed: number) {
  const next = [...stories];
  let state = seed + 1;

  for (let i = next.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const j = state % (i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

export function InternalStoryCloud({ stories }: InternalStoryCloudProps) {
  const [batchIndex, setBatchIndex] = useState(0);
  const visibleStories = useMemo(() => shuffleStories(stories, batchIndex).slice(0, Math.min(stories.length, slots.length)), [stories, batchIndex]);

  if (stories.length === 0) {
    return <div className="internal-empty">还没有发布的天协往事。</div>;
  }

  return (
    <section className="story-cloud-panel" aria-label="天协往事云图">
      <div className="story-cloud-head">
        <div>
          <span className="internal-kicker">Memory Cloud</span>
          <h1>天协往事</h1>
          <p>一些只在内部流传的短句、片段和小小回声。每次换一批，像在星图里捡起几颗旧光点。</p>
        </div>
        <button className="button-ghost story-refresh-button" type="button" onClick={() => setBatchIndex((value) => value + 1)}>
          <RefreshCw size={18} />
          换一批
        </button>
      </div>

      <div className="story-cloud-canvas">
        {visibleStories.map((story, index) => {
          const slot = slots[index];

          return (
            <article
              className={`story-cloud-item story-cloud-item-${slot.size}`}
              key={`${story.id}-${batchIndex}`}
              style={
                {
                  "--story-x": `${slot.x}%`,
                  "--story-y": `${slot.y}%`,
                  "--story-rotate": `${slot.rotate}deg`,
                  "--story-delay": `${index * 34}ms`
                } as CSSProperties
              }
            >
              {story.title ? <strong>{story.title}</strong> : null}
              <p>{story.content}</p>
              {story.source ? <span>{story.source}</span> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
