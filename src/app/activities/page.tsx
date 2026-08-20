import { MediaFrame } from "@/components/site/media-frame";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
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

function formatDateTime(date?: Date | null) {
  if (!date) return "待定";

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatActivityTime(startAt?: Date | null, endAt?: Date | null) {
  if (!startAt && !endAt) return "时间待定";
  if (startAt && !endAt) return formatDateTime(startAt);
  if (!startAt && endAt) return `截至 ${formatDateTime(endAt)}`;

  const sameDay = startAt!.toDateString() === endAt!.toDateString();
  if (sameDay) {
    return `${formatDateTime(startAt)} — ${endAt!.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit"
    })}`;
  }

  return `${formatDateTime(startAt)} — ${formatDateTime(endAt)}`;
}

function getActivityStatus(startAt?: Date | null, endAt?: Date | null) {
  const now = new Date();
  if (!startAt && !endAt) return "待安排";
  if (endAt && endAt < now) return "已结束";
  if (startAt && startAt <= now && (!endAt || endAt >= now)) return "进行中";
  return "即将开始";
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
  const featuredNotice = upcomingNotices[0];
  const supportingNotices = upcomingNotices.slice(1);
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
              <h2>社团活动</h2>
              <p className="muted">
                {setting.activitiesIntroZh || "这里展示社团活动卡片信息。点击按钮后，会跳转到公众号文章或外部活动页面。"}
              </p>
            </div>
            <p className="muted">共 {notices.length} 场活动</p>
          </header>

          <form className="search-form editorial-search activity-search" action="/activities" data-reveal>
            <label htmlFor="activity-search-input">检索活动</label>
            <input id="activity-search-input" name="q" defaultValue={q} placeholder="标题、简介或地点" />
            <button type="submit">搜索</button>
          </form>

          <section className="activity-promotion-section" aria-labelledby="upcoming-heading" data-reveal>
            <div className="activity-editorial-heading">
              <div>
                <h3 id="upcoming-heading">近期活动</h3>
              </div>
            </div>

            {!featuredNotice ? (
              <div className="activity-empty-state"><strong>暂无活动预告</strong></div>
            ) : (
              <div className="activity-promotions">
                {(() => {
                  const notice = featuredNotice;
                  const date = formatDay(notice.startAt);
                  const status = getActivityStatus(notice.startAt, notice.endAt);
                  const linkProps = getActivityLinkProps(notice.externalUrl);

                  return (
                    <article className="activity-feature" data-reveal-item>
                      <a className="activity-feature-media" {...linkProps} aria-label={`查看活动：${notice.titleZh}`}>
                        <MediaFrame
                          src={notice.coverImagePath}
                          alt={notice.titleZh}
                          className="activity-feature-cover"
                          label="活动主视觉"
                          sizes="(max-width: 720px) 100vw, (max-width: 1180px) 62vw, 700px"
                        />
                      </a>

                      <div className="activity-feature-copy">
                        <div className="activity-promotion-topline">
                          <span className="activity-promotion-status" data-status={status}>{status}</span>
                        </div>

                        <time className="activity-feature-date" dateTime={notice.startAt?.toISOString()}>
                          {date.isScheduled ? (
                            <>
                              <span key="month">{date.month}</span>
                              <i key="separator">/</i>
                              <span key="day">{date.day}</span>
                              <small key="context">{date.year} · {date.weekday}</small>
                            </>
                          ) : (
                            <strong>日期待定</strong>
                          )}
                        </time>

                        <a className="activity-feature-title" {...linkProps}>
                          <h3>{notice.titleZh}</h3>
                          {notice.titleEn ? <span>{notice.titleEn}</span> : null}
                        </a>

                        {notice.summaryZh ? <p className="activity-feature-summary">{notice.summaryZh}</p> : null}

                        <dl className="activity-feature-meta">
                          <div><dt>时间</dt><dd>{formatActivityTime(notice.startAt, notice.endAt)}</dd></div>
                          {notice.locationZh ? <div><dt>地点</dt><dd>{notice.locationZh}</dd></div> : null}
                        </dl>

                        <a className="activity-editorial-link" {...linkProps}>
                          查看活动 <span aria-hidden="true">{notice.externalUrl ? "↗" : "→"}</span>
                        </a>
                      </div>
                    </article>
                  );
                })()}

                {supportingNotices.length > 0 ? (
                  <div className="activity-supporting-grid">
                    {supportingNotices.map((notice) => {
                      const date = formatDay(notice.startAt);
                      const status = getActivityStatus(notice.startAt, notice.endAt);
                      const linkProps = getActivityLinkProps(notice.externalUrl);

                      return (
                        <article className="activity-supporting" data-reveal-item key={notice.id}>
                          <a className="activity-supporting-media" {...linkProps} aria-label={`查看活动：${notice.titleZh}`}>
                            <MediaFrame
                              src={notice.coverImagePath}
                              alt={notice.titleZh}
                              className="activity-supporting-cover"
                              label="活动主视觉"
                              sizes="(max-width: 720px) 100vw, (max-width: 1180px) 50vw, 560px"
                            />
                          </a>
                          <div className="activity-supporting-copy">
                            <div className="activity-supporting-date">
                              <time dateTime={notice.startAt?.toISOString()}>{date.isScheduled ? date.monthDay : "日期待定"}</time>
                              <span>{date.isScheduled ? `${date.year} · ${date.weekday}` : status}</span>
                            </div>
                            <span className="activity-promotion-status" data-status={status}>{status}</span>
                            <a className="activity-supporting-title" {...linkProps}>
                              <h4>{notice.titleZh}</h4>
                              {notice.titleEn ? <span>{notice.titleEn}</span> : null}
                            </a>
                            {notice.summaryZh ? <p>{notice.summaryZh}</p> : null}
                            <div className="activity-supporting-meta">
                              <time>{formatActivityTime(notice.startAt, notice.endAt)}</time>
                              {notice.locationZh ? <span>{notice.locationZh}</span> : null}
                            </div>
                            <a className="activity-editorial-link" {...linkProps}>
                              查看活动 <span aria-hidden="true">{notice.externalUrl ? "↗" : "→"}</span>
                            </a>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <section className="activity-archive-section" aria-labelledby="archive-heading" data-reveal>
            <div className="activity-editorial-heading activity-archive-heading">
              <div>
                <h3 id="archive-heading">往期活动</h3>
              </div>
              <span>共 {recordNotices.length} 场 · 按时间归档</span>
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
