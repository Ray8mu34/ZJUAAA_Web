"use client";

import {
  BookOpen,
  Camera,
  Coffee,
  Compass,
  Map,
  MessageCircle,
  Moon,
  Orbit,
  RefreshCw,
  Rocket,
  ScrollText,
  Sparkles,
  Star,
  Telescope
} from "lucide-react";
import type { ComponentType, CSSProperties } from "react";
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

type BoardSlot = {
  x: number;
  y: number;
  rotate: number;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

const boardSlots: BoardSlot[] = [
  { x: 9, y: 18, rotate: -5, Icon: Telescope },
  { x: 24, y: 34, rotate: 4, Icon: Star },
  { x: 39, y: 19, rotate: -2, Icon: Moon },
  { x: 54, y: 38, rotate: 5, Icon: Rocket },
  { x: 70, y: 20, rotate: -4, Icon: Sparkles },
  { x: 86, y: 37, rotate: 3, Icon: Camera },
  { x: 14, y: 68, rotate: 4, Icon: Coffee },
  { x: 31, y: 57, rotate: -3, Icon: Compass },
  { x: 47, y: 75, rotate: 2, Icon: BookOpen },
  { x: 64, y: 63, rotate: -5, Icon: MessageCircle },
  { x: 79, y: 72, rotate: 4, Icon: Map },
  { x: 91, y: 60, rotate: -2, Icon: Orbit }
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

function getStoryTitle(story: Story) {
  return story.title || story.content.split(/\s|\n/).find(Boolean)?.slice(0, 12) || "一段往事";
}

export function InternalStoryCloud({ stories }: InternalStoryCloudProps) {
  const [batchIndex, setBatchIndex] = useState(0);
  const visibleCount = Math.min(stories.length, boardSlots.length);
  const visibleStories = useMemo(() => shuffleStories(stories, batchIndex).slice(0, visibleCount), [stories, batchIndex, visibleCount]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const activeStory = visibleStories.find((story) => story.id === activeStoryId) || visibleStories[0] || null;

  if (stories.length === 0) {
    return <div className="internal-empty">还没有发布的天协往事。</div>;
  }

  return (
    <section className="story-cloud-panel" aria-label="天协往事展板">
      <div className="story-cloud-head">
        <div>
          <span className="internal-kicker">Memory Board</span>
          <h1>天协往事</h1>
          <p>把零散的回忆贴在一块展板上。点开一个小图标，就能翻到它背后的故事。</p>
        </div>
        <button
          className="button-ghost story-refresh-button"
          type="button"
          onClick={() => {
            setActiveStoryId(null);
            setBatchIndex((value) => value + 1);
          }}
        >
          <RefreshCw size={18} />
          换一批
        </button>
      </div>

      <div className="story-board">
        <div className="story-board-surface" data-count={visibleStories.length}>
          {visibleStories.map((story, index) => {
            const slot = boardSlots[index];
            const Icon = slot.Icon;
            const isActive = activeStory?.id === story.id;

            return (
              <button
                className={isActive ? "story-doodle is-active" : "story-doodle"}
                key={`${story.id}-${batchIndex}`}
                type="button"
                onClick={() => setActiveStoryId(story.id)}
                style={
                  {
                    "--story-x": `${slot.x}%`,
                    "--story-y": `${slot.y}%`,
                    "--story-rotate": `${slot.rotate}deg`,
                    "--story-delay": `${index * 28}ms`
                  } as CSSProperties
                }
              >
                <span className="story-doodle-title">{getStoryTitle(story)}</span>
                <span className="story-doodle-icon">
                  <Icon size={30} strokeWidth={1.9} />
                </span>
              </button>
            );
          })}
        </div>

        {activeStory ? (
          <article className="story-detail-panel">
            <span className="internal-kicker">Selected Memory</span>
            <h2>{getStoryTitle(activeStory)}</h2>
            {activeStory.source ? <strong>{activeStory.source}</strong> : null}
            <p>{activeStory.content}</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}
