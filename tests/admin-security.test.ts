import { describe, expect, it } from "vitest";

import { assertAdminPasswordLength, assertCanDisableAdmin, MIN_ADMIN_PASSWORD_LENGTH } from "@/lib/admin-security";

describe("assertAdminPasswordLength", () => {
  it("rejects passwords shorter than the configured minimum", () => {
    expect(() => assertAdminPasswordLength("short")).toThrow(`${MIN_ADMIN_PASSWORD_LENGTH} 位`);
  });

  it("accepts passwords at the configured minimum length", () => {
    expect(() => assertAdminPasswordLength("a".repeat(MIN_ADMIN_PASSWORD_LENGTH))).not.toThrow();
  });
});

describe("assertCanDisableAdmin", () => {
  it("rejects disabling the current admin", () => {
    expect(() =>
      assertCanDisableAdmin({
        activeAdminCount: 2,
        currentAdminId: "admin-1",
        targetAdmin: { id: "admin-1", status: "ACTIVE" }
      })
    ).toThrow("当前登录");
  });

  it("rejects disabling the last active admin", () => {
    expect(() =>
      assertCanDisableAdmin({
        activeAdminCount: 1,
        currentAdminId: "admin-2",
        targetAdmin: { id: "admin-1", status: "ACTIVE" }
      })
    ).toThrow("最后一个");
  });

  it("accepts disabling another admin when an active admin remains", () => {
    expect(() =>
      assertCanDisableAdmin({
        activeAdminCount: 2,
        currentAdminId: "admin-2",
        targetAdmin: { id: "admin-1", status: "ACTIVE" }
      })
    ).not.toThrow();
  });
});
