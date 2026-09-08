type ActivityTiming = {
  startAt?: Date | null;
  endAt?: Date | null;
};

export function isActivityEnded(activity: ActivityTiming, now = new Date()) {
  if (activity.endAt) return activity.endAt < now;
  if (activity.startAt) return activity.startAt < now;
  return false;
}

export function shouldShowInActivityArchive(
  activity: ActivityTiming & { isArchived: boolean },
  now = new Date()
) {
  return activity.isArchived && isActivityEnded(activity, now);
}
