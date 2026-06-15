import { MediaFrame } from "@/components/site/media-frame";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

function formatDay(date?: Date | null) {
  if (!date) return { monthDay: "待定", year: "TBD", weekday: "时间待定" };

  return {
    monthDay: date.toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit"
    }),
    year: date.toLocaleDateString("zh-CN", {
      year: "numeric"
    }),
    weekday: date.toLocaleDateString("zh-CN", {
      weekday: "short"
    })
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
    return `${formatDateTime(startAt)} - ${endAt!.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit"
    })}`;
  }

  return `${formatDateTime(startAt)} - ${formatDateTime(endAt)}`;
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

export default async function ActivitiesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = (await searchParams) || {};
  const q = params.q?.trim() || "";

  const [setting, notices] = await Promise.all([
    prisma.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {}
    }),
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
      orderBy: [{ startAt: "asc" }, { createdAt: "desc" }]
    })
  ]);

  const emptyCardClassName = setting.cardTheme === "light" ? "content-card card-theme-light activity-empty-card" : "content-card activity-empty-card";
  const upcomingNotices = notices.filter((notice) => !isActivityRecord(notice.startAt, notice.endAt)).sort(sortByUpcomingTime);
  const recordNotices = notices.filter((notice) => isActivityRecord(notice.startAt, notice.endAt)).sort(sortByRecordTime);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          <div className="section-head activity-section-head">
            <div>
              <h2>社团活动</h2>
              <p className="muted">
                {setting.activitiesIntroZh || "这里展示社团活动卡片信息。点击按钮后，会跳转到公众号文章或外部活动页面。"}
              </p>
            </div>
            <p className="muted activity-count">共 {notices.length} 项活动</p>
          </div>

          <form className="search-form" action="/activities">
            <input name="q" defaultValue={q} placeholder="搜索活动标题、摘要或地点" />
            <button className="button-secondary" type="submit">
              搜索
            </button>
          </form>

          <section className="activity-feature-section">
            <div className="activity-subhead">
              <div>
                <h3>活动预告</h3>
              </div>
            </div>

            {upcomingNotices.length === 0 ? (
              <article className={emptyCardClassName}>
                <strong>暂无活动预告</strong>
              </article>
            ) : (
              <div className="activity-feature-grid">
                {upcomingNotices.map((notice) => {
                  const date = formatDay(notice.startAt);
                  const status = getActivityStatus(notice.startAt, notice.endAt);
                  const href = notice.externalUrl || "/activities";

                  return (
                    <article className="activity-feature-card" key={notice.id}>
                      <a className="activity-feature-media" href={href} target={notice.externalUrl ? "_blank" : undefined} rel={notice.externalUrl ? "noreferrer" : undefined}>
                        <MediaFrame src={notice.coverImagePath} alt={notice.titleZh} className="activity-feature-cover" label="活动封面" />
                        <div className="activity-feature-date">
                          <span>{date.year}</span>
                          <strong>{date.monthDay}</strong>
                          <em>{date.weekday}</em>
                        </div>
                      </a>

                      <div className="activity-feature-info">
                        <div className="activity-title-row">
                          <span className={`activity-status activity-status-${status === "已结束" ? "ended" : status === "进行中" ? "live" : "upcoming"}`}>
                            {status}
                          </span>
                          <span className="activity-location">{notice.locationZh || "地点待定"}</span>
                        </div>

                        <a className="activity-main-link" href={href} target={notice.externalUrl ? "_blank" : undefined} rel={notice.externalUrl ? "noreferrer" : undefined}>
                          <h3>{notice.titleZh}</h3>
                        </a>

                        <p>{notice.summaryZh || "点击后查看活动详情或跳转到外部活动页面。"}</p>

                        <div className="activity-meta-row">
                          <time>{formatActivityTime(notice.startAt, notice.endAt)}</time>
                          <a className="button-secondary activity-action" href={href} target={notice.externalUrl ? "_blank" : undefined} rel={notice.externalUrl ? "noreferrer" : undefined}>
                            查看详情
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="activity-record-section">
            <div className="activity-subhead">
              <div>
                <h3>活动记录</h3>
              </div>
            </div>

            <div className="activity-record-list">
              {recordNotices.length === 0 ? (
                <article className={emptyCardClassName}>
                  <strong>还没有活动记录</strong>
                </article>
              ) : (
                recordNotices.map((notice, index) => {
                const date = formatDay(notice.startAt);
                const status = getActivityStatus(notice.startAt, notice.endAt);
                const href = notice.externalUrl || "/activities";

                return (
                  <article className="activity-record-card" key={notice.id}>
                    <a className="activity-record-media" href={href} target={notice.externalUrl ? "_blank" : undefined} rel={notice.externalUrl ? "noreferrer" : undefined}>
                      <MediaFrame src={notice.coverImagePath} alt={notice.titleZh} className="activity-record-cover" label="活动封面" />
                    </a>

                    <div className="activity-record-body">
                      <div className="activity-record-kicker">
                        <span>活动记录</span>
                        <time>{date.year} / {date.monthDay}</time>
                      </div>

                      <a className="activity-record-link" href={href} target={notice.externalUrl ? "_blank" : undefined} rel={notice.externalUrl ? "noreferrer" : undefined}>
                        <h3>{notice.titleZh}</h3>
                      </a>

                      <p>{notice.summaryZh || "点击后查看活动回顾。"}</p>

                      <div className="activity-record-meta">
                        <span>{notice.locationZh || "地点待定"}</span>
                        <span>{status}</span>
                      </div>
                    </div>

                    <a className="activity-record-index" href={href} target={notice.externalUrl ? "_blank" : undefined} rel={notice.externalUrl ? "noreferrer" : undefined}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </a>
                  </article>
                );
                })
              )}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
