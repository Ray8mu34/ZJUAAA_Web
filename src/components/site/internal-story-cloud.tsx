"use client";

import {
  Archive,
  BookOpen,
  Camera,
  Clock,
  CloudMoon,
  Coffee,
  Compass,
  Flag,
  Image,
  Lightbulb,
  Map,
  MapPin,
  Megaphone,
  MessageCircle,
  Milestone,
  Moon,
  Notebook,
  Orbit,
  PenTool,
  RefreshCw,
  Rocket,
  ScrollText,
  Sparkles,
  Star,
  Telescope,
  Users
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
};

const doodleIcons: ComponentType<{ size?: number; strokeWidth?: number }>[] = [
  Telescope,
  Star,
  Moon,
  Rocket,
  Sparkles,
  Camera,
  Coffee,
  Compass,
  BookOpen,
  MessageCircle,
  Map,
  Orbit,
  Clock,
  Notebook,
  Megaphone,
  Users,
  MapPin,
  Image,
  Lightbulb,
  PenTool,
  Archive,
  Flag,
  CloudMoon,
  Milestone
];

const boardSlots: BoardSlot[] = [
  { x: 12, y: 20, rotate: -5 },
  { x: 27, y: 42, rotate: 4 },
  { x: 42, y: 23, rotate: -2 },
  { x: 58, y: 46, rotate: 5 },
  { x: 73, y: 24, rotate: -4 },
  { x: 87, y: 43, rotate: 3 },
  { x: 17, y: 72, rotate: 4 },
  { x: 37, y: 65, rotate: -3 },
  { x: 55, y: 76, rotate: 2 },
  { x: 73, y: 69, rotate: -5 },
  { x: 88, y: 74, rotate: 4 },
  { x: 49, y: 58, rotate: -1 }
];

function shuffleItems<T>(items: T[], seed: number) {
  const next = [...items];
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
  const batchSize = stories.length <= 8 ? stories.length : 6 + (batchIndex % 3);
  const visibleCount = Math.min(stories.length, batchSize);
  const visibleStories = useMemo(() => shuffleItems(stories, batchIndex).slice(0, visibleCount), [stories, batchIndex, visibleCount]);
  const visibleSlots = useMemo(() => shuffleItems(boardSlots, batchIndex + 11).slice(0, visibleCount), [batchIndex, visibleCount]);
  const visibleIcons = useMemo(() => shuffleItems(doodleIcons, batchIndex + 23).slice(0, visibleCount), [batchIndex, visibleCount]);
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
            const slot = visibleSlots[index];
            const Icon = visibleIcons[index];
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
