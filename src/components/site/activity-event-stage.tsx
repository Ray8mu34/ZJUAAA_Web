"use client";

import Image from "next/image";
import { useState } from "react";

import { getImageVariantUrl } from "@/lib/image-variants";

export type ActivityEventStageItem = {
  id: string;
  title: string;
  titleEn?: string | null;
  poster?: string | null;
  dateLabel?: string | null;
  timeLabel?: string | null;
  startAt?: string | null;
  location?: string | null;
  description?: string | null;
  status: string;
  url: string;
  isExternal: boolean;
};

type ActivityEventStageProps = {
  activities: ActivityEventStageItem[];
};

function getLinkProps(activity: ActivityEventStageItem) {
  return {
    href: activity.url,
    rel: activity.isExternal ? "noreferrer" : undefined,
    target: activity.isExternal ? ("_blank" as const) : undefined
  };
}

export function ActivityEventStage({ activities }: ActivityEventStageProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (activities.length === 0) return null;

  const activity = activities[activeIndex];
  const linkProps = getLinkProps(activity);
  const showControls = activities.length > 1;

  function selectRelativeActivity(offset: number) {
    setActiveIndex((current) => (current + offset + activities.length) % activities.length);
  }

  return (
    <div className="activity-event-stage">
      <article className="activity-event-stage-body" key={activity.id} aria-live="polite">
        <div className="activity-stage-poster-column">
          <a className="activity-stage-poster-link" {...linkProps} aria-label={`查看活动：${activity.title}`}>
            {activity.poster ? (
              <span className="activity-stage-poster-frame">
                <Image
                  src={getImageVariantUrl(activity.poster, "original")}
                  alt={`${activity.title}活动海报`}
                  fill
                  priority={activeIndex === 0}
                  sizes="(max-width: 760px) calc(100vw - 84px), (max-width: 1040px) 42vw, 440px"
                />
              </span>
            ) : (
              <span className="activity-stage-poster-fallback">
                <strong>{activity.title}</strong>
                {activity.dateLabel ? <span>{activity.dateLabel}</span> : null}
              </span>
            )}
          </a>
        </div>

        <div className="activity-stage-copy">
          <span className="activity-stage-status" data-status={activity.status}>{activity.status}</span>

          <a className="activity-stage-title" {...linkProps}>
            <h3>{activity.title}</h3>
            {activity.titleEn ? <span>{activity.titleEn}</span> : null}
          </a>

          {activity.dateLabel || activity.timeLabel || activity.location ? (
            <div className="activity-stage-facts">
              {activity.dateLabel ? (
                <time dateTime={activity.startAt || undefined}>{activity.dateLabel}</time>
              ) : null}
              {activity.timeLabel ? <span>{activity.timeLabel}</span> : null}
              {activity.location ? <span>{activity.location}</span> : null}
            </div>
          ) : null}

          {activity.description ? <p className="activity-stage-summary">{activity.description}</p> : null}

          <div className="activity-stage-actions">
            <a className="activity-stage-link" {...linkProps}>
              查看活动 <span aria-hidden="true">{activity.isExternal ? "↗" : "→"}</span>
            </a>

            {showControls ? (
              <div className="activity-stage-controls" aria-label="切换近期活动">
                <span aria-live="off">
                  {String(activeIndex + 1).padStart(2, "0")} / {String(activities.length).padStart(2, "0")}
                </span>
                <div>
                  <button type="button" onClick={() => selectRelativeActivity(-1)} aria-label="上一个活动">←</button>
                  <button type="button" onClick={() => selectRelativeActivity(1)} aria-label="下一个活动">→</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}
