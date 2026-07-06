import adminSecurityConfig from "../../config/admin-security.json";

export const MIN_ADMIN_PASSWORD_LENGTH = adminSecurityConfig.minAdminPasswordLength;

type ActiveAdminGuardInput = {
  activeAdminCount: number;
  currentAdminId?: string | null;
  targetAdmin: {
    id: string;
    status: "ACTIVE" | "DISABLED";
  } | null;
};

export function assertAdminPasswordLength(password: string) {
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(`管理员密码至少需要 ${MIN_ADMIN_PASSWORD_LENGTH} 位。`);
  }
}

export function assertCanDisableAdmin({ activeAdminCount, currentAdminId, targetAdmin }: ActiveAdminGuardInput) {
  if (!targetAdmin) {
    throw new Error("管理员不存在。");
  }

  if (currentAdminId && targetAdmin.id === currentAdminId) {
    throw new Error("不能禁用当前登录的管理员账号。");
  }

  if (targetAdmin.status === "ACTIVE" && activeAdminCount <= 1) {
    throw new Error("不能禁用最后一个启用状态的管理员。");
  }
}
