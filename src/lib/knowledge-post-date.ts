const shanghaiDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Shanghai"
});

export function formatKnowledgePublishedAtInput(date?: Date | null) {
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = Object.fromEntries(
    shanghaiDateTimeFormatter.formatToParts(date).map(({ type, value }) => [type, value])
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function parseKnowledgePublishedAtInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    throw new Error("原始发布时间格式不正确。");
  }

  const date = new Date(`${trimmed}:00+08:00`);

  if (Number.isNaN(date.getTime()) || formatKnowledgePublishedAtInput(date) !== trimmed) {
    throw new Error("原始发布时间不是有效日期。");
  }

  return date;
}
