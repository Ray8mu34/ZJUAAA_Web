const calendar = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23"
});
const weekdays: Record<string, string> = { Mon: "周一", Tue: "周二", Wed: "周三", Thu: "周四", Fri: "周五", Sat: "周六", Sun: "周日" };

export function getActivityDate(date?: Date | string | null) {
  if (!date) return null;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  const parts = Object.fromEntries(calendar.formatToParts(value).map(({ type, value }) => [type, value]));
  return {
    year: parts.year, month: parts.month, day: parts.day, weekday: parts.weekday.toUpperCase(),
    dateLabel: `${parts.year}.${parts.month}.${parts.day}（${weekdays[parts.weekday]}）`,
    timeLabel: `${parts.hour}:${parts.minute}`
  };
}

export function formatActivitySchedule(startAt?: Date | null, endAt?: Date | null) {
  const start = getActivityDate(startAt);
  const end = getActivityDate(endAt);
  if (!start) return { dateLabel: end ? `截至 ${end.dateLabel}` : "时间待定", timeLabel: end?.timeLabel || null };
  return {
    dateLabel: start.dateLabel,
    timeLabel: end
      ? `${start.timeLabel}–${end.dateLabel === start.dateLabel ? "" : `${end.dateLabel} `}${end.timeLabel}`
      : start.timeLabel
  };
}
