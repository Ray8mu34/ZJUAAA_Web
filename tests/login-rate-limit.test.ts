import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearLoginFailures,
  formatRetryAfter,
  getLoginRateLimitState,
  recordLoginFailure
} from "@/lib/login-rate-limit";

describe("login rate limiting", () => {
  afterEach(() => {
    vi.useRealTimers();
    clearLoginFailures("test", "user@example.com");
  });

  it("blocks after the configured failure threshold", () => {
    for (let index = 0; index < 3; index += 1) {
      recordLoginFailure("test", "user@example.com", {
        maxAttempts: 3,
        lockMs: 60_000
      });
    }

    expect(getLoginRateLimitState("test", "user@example.com", { maxAttempts: 3 }).blocked).toBe(true);
  });

  it("clears failures after a successful login", () => {
    recordLoginFailure("test", "user@example.com");
    clearLoginFailures("test", "user@example.com");

    expect(getLoginRateLimitState("test", "user@example.com").blocked).toBe(false);
  });

  it("formats retry windows for user-facing messages", () => {
    expect(formatRetryAfter(30)).toBe("1 分钟内");
    expect(formatRetryAfter(121)).toBe("3 分钟后");
  });
});
