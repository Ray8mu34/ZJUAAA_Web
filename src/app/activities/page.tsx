import { MediaFrame } from "@/components/site/media-frame";
import { ActivityEventStage, type ActivityEventStageItem } from "@/components/site/activity-event-stage";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { formatActivitySchedule } from "@/lib/activity-date";
import { prisma } from "@/lib/db";

function formatDay(date?: Date | null) {
  if (!date) {
    return {
      day: "",
      isScheduled: false,
      month: "",
      monthDay: "待定",
      weekday: "",
      year: "TBD"
    };
  }

  return {
    day: String(date.getDate()).padStart(2, "0"),
    isScheduled: true,
    month: String(date.getMonth() + 1).padStart(2, "0"),
    monthDay: date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
    weekday: date.toLocaleDateString("zh-CN", { weekday: "short" }),
    year: String(date.getFullYear())
  };
}

function isActivityRecord(startAt?: Date | null, endAt?: Date | null) {
  const now = new Date();
  if (endAt) return endAt < now;
  if (startAt) return startAt < now;
  return false;
}

function sortByUpcomingTime(a: { startAt: Date | null; createdAt: Date }, b: { startAt: Date | null; createdAt: Date }) {
  return (a.startAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.startAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
}

function sortByRecordTime(a: { startAt: Date | null; createdAt: Date }, b: { startAt: Date | null; createdAt: Date }) {
  return (b.startAt?.getTime() ?? b.createdAt.getTime()) - (a.startAt?.getTime() ?? a.createdAt.getTime());
}

function getActivityLinkProps(externalUrl?: string | null) {
  return {
    href: externalUrl || "/activities",
    rel: externalUrl ? "noreferrer" : undefined,
    target: externalUrl ? ("_blank" as const) : undefined
  };
}

export default async function ActivitiesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = (await searchParams) || {};
  const q = params.q?.trim() || "";

  const [setting, notices] = await Promise.all([
    prisma.siteSetting.upsert({ where: { id: "site" }, create: { id: "site" }, update: {} }),
    prisma.activityNotice.findMany({
      where: {
        status: "PUBLISHED",
        ...(q
          ? {
              OR: [
                { titleZh: { contains: q } },
                { summaryZh: { contains: q } },
                { locationZh: { contains: q } }
              ]
            }
          : {})
      },
      orderBy: [{ startAt: "asc" }, { createdAt: "desc" }],
      take: 80
    })
  ]);

  const upcomingNotices = notices.filter((notice) => !isActivityRecord(notice.startAt, notice.endAt)).sort(sortByUpcomingTime);
  const recordNotices = notices.filter((notice) => isActivityRecord(notice.startAt, notice.endAt)).sort(sortByRecordTime);
  const stageActivities: ActivityEventStageItem[] = upcomingNotices.map((notice) => {
    const schedule = formatActivitySchedule(notice.startAt, notice.endAt);
    return {
      id: notice.id,
      title: notice.titleZh,
      poster: notice.coverImagePath,
      dateLabel: schedule.dateLabel,
      timeLabel: schedule.timeLabel,
      startAt: notice.startAt?.toISOString() || null,
      location: notice.locationZh,
      url: notice.externalUrl || "/activities",
      isExternal: Boolean(notice.externalUrl)
    };
  });
  const recordGroups = Array.from(
    recordNotices
      .reduce((groups, notice) => {
        const year = String((notice.startAt || notice.endAt || notice.createdAt).getFullYear());
        const group = groups.get(year) || [];
        group.push(notice);
        groups.set(year, group);
        return groups;
      }, new Map<string, typeof recordNotices>())
      .entries()
  );

  return (
    <>
      <SiteHeader />
      <main className="section activity-page">
        <div className="shell">
          <header className="section-head" data-reveal>
            <div>
              <h1>社团活动</h1>
              <p className="muted">
                {setting.activitiesIntroZh || "关注社团最新活动与往期记录。"}
              </p>
            </div>
            <p className="muted">共 {notices.length} 场活动</p>
          </header>

          <form className="search-form editorial-search activity-search" action="/activities" data-reveal>
            <label htmlFor="activity-search-input">检索活动</label>
            <input id="activity-search-input" name="q" defaultValue={q} placeholder="标题、简介或地点" />
            <button type="submit">搜索</button>
          </form>

          {stageActivities.length > 0 ? (
            <section className="activity-promotion-section" aria-label="近期活动" data-reveal>
              <ActivityEventStage activities={stageActivities} />
            </section>
          ) : null}

          <section className="activity-archive-section" aria-labelledby="archive-heading" data-reveal>
            <div className="activity-editorial-heading activity-archive-heading">
              <div>
                <h2 id="archive-heading">往期活动</h2>
              </div>
              <span>共 {recordNotices.length} 场</span>
            </div>

            {recordGroups.length === 0 ? (
              <div className="activity-empty-state activity-archive-empty"><strong>还没有活动记录</strong></div>
            ) : (
              <div className="activity-archive-groups">
                {recordGroups.map(([year, group]) => (
                  <section className="activity-archive-year" aria-labelledby={`activity-year-${year}`} key={year}>
                    <h3 id={`activity-year-${year}`}>{year}</h3>
                    <div className="activity-archive-index">
                      <div className="activity-archive-columns" aria-hidden="true">
                        <span>日期</span><span>活动</span><span>地点</span><span />
                      </div>
                      {group.map((notice) => {
                        const date = formatDay(notice.startAt);
                        const linkProps = getActivityLinkProps(notice.externalUrl);

                        return (
                          <a key={notice.id} className="activity-archive-row" {...linkProps}>
                            <time dateTime={notice.startAt?.toISOString()}>
                              <strong>{date.isScheduled ? date.monthDay.replace("/", ".") : "待定"}</strong>
                              {date.weekday ? <small>{date.weekday}</small> : null}
                            </time>
                            <span className="activity-archive-title">
                              <strong>{notice.titleZh}</strong>
                              {notice.titleEn ? <small>{notice.titleEn}</small> : null}
                            </span>
                            <span className="activity-archive-location">{notice.locationZh || "—"}</span>
                            <span className="activity-archive-arrow" aria-hidden="true">{notice.externalUrl ? "↗" : "→"}</span>
                            {notice.coverImagePath ? (
                              <span className="activity-archive-preview" aria-hidden="true">
                                <MediaFrame src={notice.coverImagePath} alt="" className="activity-archive-cover" sizes="280px" />
                              </span>
                            ) : null}
                          </a>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
