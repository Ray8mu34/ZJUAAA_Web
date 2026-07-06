const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_LOCK_MS = 15 * 60 * 1000;

type Bucket = {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
};

const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

function normalizeKey(scope: string, identifier: string) {
  return `${scope}:${identifier.trim().toLowerCase() || "anonymous"}`;
}

export function getLoginRateLimitState(
  scope: string,
  identifier: string,
  options: {
    maxAttempts?: number;
    windowMs?: number;
    lockMs?: number;
  } = {}
) {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const key = normalizeKey(scope, identifier);
  const current = now();
  const bucket = buckets.get(key);

  if (!bucket) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  if (bucket.lockedUntil > current) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((bucket.lockedUntil - current) / 1000)
    };
  }

  if (current - bucket.firstAttemptAt > windowMs) {
    buckets.delete(key);
    return { blocked: false, retryAfterSeconds: 0 };
  }

  return {
    blocked: bucket.attempts >= maxAttempts,
    retryAfterSeconds: bucket.attempts >= maxAttempts ? Math.ceil(windowMs / 1000) : 0
  };
}

export function recordLoginFailure(
  scope: string,
  identifier: string,
  options: {
    maxAttempts?: number;
    windowMs?: number;
    lockMs?: number;
  } = {}
) {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const lockMs = options.lockMs ?? DEFAULT_LOCK_MS;
  const key = normalizeKey(scope, identifier);
  const current = now();
  const existing = buckets.get(key);
  const bucket =
    existing && current - existing.firstAttemptAt <= windowMs
      ? existing
      : {
          attempts: 0,
          firstAttemptAt: current,
          lockedUntil: 0
        };

  bucket.attempts += 1;

  if (bucket.attempts >= maxAttempts) {
    bucket.lockedUntil = current + lockMs;
  }

  buckets.set(key, bucket);
}

export function clearLoginFailures(scope: string, identifier: string) {
  buckets.delete(normalizeKey(scope, identifier));
}

export function formatRetryAfter(seconds: number) {
  if (seconds <= 60) return "1 分钟内";
  return `${Math.ceil(seconds / 60)} 分钟后`;
}
