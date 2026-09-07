"use client";

import Image from "next/image";
import { useState } from "react";

import { getImageVariantUrl } from "@/lib/image-variants";
import { getActivityDate } from "@/lib/activity-date";

export type ActivityEventStageItem = {
  id: string;
  title: string;
  poster?: string | null;
  dateLabel?: string | null;
  timeLabel?: string | null;
  startAt?: string | null;
  location?: string | null;
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

  const activity = activities[activeIndex] || activities[0];
  const date = getActivityDate(activity.startAt);
  const linkProps = getLinkProps(activity);
  const showControls = activities.length > 1;

  function selectRelativeActivity(offset: number) {
    setActiveIndex((current) => (current + offset + activities.length) % activities.length);
  }

  return (
    <div className="activity-event-stage">
      <article className="activity-event-stage-body" key={activity.id} aria-live="polite">
        <div className="activity-stage-date">
          <span className="activity-stage-date-accessible">{activity.dateLabel || "时间待定"}</span>
          <span className="activity-stage-date-caption" aria-hidden="true">相约星空</span>
          <div className="activity-stage-date-numbers" aria-hidden="true">
            <span>{date?.month || "—"}</span>
            <i />
            <span>{date?.day || "—"}</span>
          </div>
          <span className="activity-stage-year" aria-hidden="true">{date?.year || "待定"}</span>
          <span className="activity-stage-weekday" aria-hidden="true">{date?.weekday || "TBA"}</span>
          <p aria-hidden="true">在日常之外<br />留一点时间<br />给辽阔的宇宙</p>
        </div>
        <div className="activity-stage-poster-column">
          <span className="activity-stage-poster-backing" aria-hidden="true" />
          <a className="activity-stage-poster-link" {...linkProps} aria-label={`查看活动：${activity.title}`}>
            {activity.poster ? (
              <span className="activity-stage-poster-frame">
                <Image
                  src={getImageVariantUrl(activity.poster, "raw")}
                  alt={`${activity.title}活动海报`}
                  width={800}
                  height={1100}
                  priority={activeIndex === 0}
                  sizes="(max-width: 760px) 65vw, 360px"
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
          <a className="activity-stage-title" {...linkProps}>
            <h2>{activity.title}</h2>
          </a>

          {activity.timeLabel || activity.location ? (
            <div className="activity-stage-facts">
              <i aria-hidden="true" />
              <time dateTime={activity.startAt || undefined}>{activity.timeLabel || "时间待定"}</time>
              {activity.location ? <span>{activity.location}</span> : null}
            </div>
          ) : null}

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
      </article>
    </div>
  );
}
