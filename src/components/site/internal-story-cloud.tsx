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

const cardPattern = [
  { size: "hero", rotate: -1.4 },
  { size: "tall", rotate: 1.2 },
  { size: "wide", rotate: -0.8 },
  { size: "soft", rotate: 1.6 },
  { size: "soft", rotate: -1.1 },
  { size: "wide", rotate: 0.7 }
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
  const visibleCount = stories.length === 1 ? 1 : Math.min(stories.length, cardPattern.length);
  const visibleStories = useMemo(() => shuffleStories(stories, batchIndex).slice(0, visibleCount), [stories, batchIndex, visibleCount]);

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

      <div className="story-cloud-canvas" data-count={visibleStories.length}>
        {visibleStories.map((story, index) => {
          const slot = cardPattern[index];

          return (
            <article
              className={`story-cloud-item story-cloud-item-${slot.size}`}
              key={`${story.id}-${batchIndex}`}
              style={
                {
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
