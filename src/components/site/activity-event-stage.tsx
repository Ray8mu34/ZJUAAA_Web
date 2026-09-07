"use client";

import Image from "next/image";
import { useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";

import { getImageVariantUrl } from "@/lib/image-variants";
import { getActivityDate } from "@/lib/activity-date";

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
  backdrop?: string | null;
};

function getLinkProps(activity: ActivityEventStageItem) {
  return {
    href: activity.url,
    rel: activity.isExternal ? "noreferrer" : undefined,
    target: activity.isExternal ? ("_blank" as const) : undefined
  };
}

export function ActivityEventStage({ activities, backdrop }: ActivityEventStageProps) {
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
        <div className="activity-stage-date" aria-hidden="true">
          <span className="activity-stage-date-caption">相约星空</span>
          <div className="activity-stage-date-numbers">
            <span>{date?.month || "—"}</span>
            <i />
            <span>{date?.day || "—"}</span>
          </div>
          <span className="activity-stage-year">{date?.year || "待定"}</span>
          <span className="activity-stage-weekday">{date?.weekday || "TBA"}</span>
          <p>在日常之外<br />留一点时间<br />给辽阔的宇宙</p>
        </div>
        <div className="activity-stage-poster-column">
          <span className="activity-stage-poster-backing" aria-hidden="true" />
          {backdrop ? <span className="activity-stage-sky" aria-hidden="true">
            <Image src={getImageVariantUrl(backdrop, "thumb")} alt="" fill sizes="160px" />
          </span> : null}
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
          <span className="activity-stage-status" data-status={activity.status}>{activity.status}</span>

          <a className="activity-stage-title" {...linkProps}>
            <h2>{activity.title}</h2>
            {activity.titleEn ? <span>{activity.titleEn}</span> : null}
          </a>

          {activity.description ? <p className="activity-stage-summary">{activity.description}</p> : null}

          {activity.dateLabel || activity.timeLabel || activity.location ? (
            <div className="activity-stage-facts">
              <div><CalendarDays aria-hidden="true" size={16} strokeWidth={1.3} />
                <time dateTime={activity.startAt || undefined}>{activity.dateLabel || "时间待定"}{activity.timeLabel ? <> <span>{activity.timeLabel}</span></> : null}</time>
              </div>
              {activity.location ? <div><MapPin aria-hidden="true" size={16} strokeWidth={1.3} /><span>{activity.location}</span></div> : null}
            </div>
          ) : null}

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
