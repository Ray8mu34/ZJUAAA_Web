import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/login-form";
import { getActiveSessionAdmin } from "@/lib/admin-session";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string; reason?: string }>;
}) {
  const session = await auth();
  const admin = await getActiveSessionAdmin(session);
  const { callbackUrl, reason } = await searchParams;

  if (session && admin) {
    redirect(callbackUrl || "/admin");
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-panel">
        <div className="brand-mark">
          <span className="brand-square" />
          <div>
            <strong>ZJUAAA CMS</strong>
            <p>登录内容管理后台，维护首页、文章、活动、手册、摄影作品和站点信息。</p>
          </div>
        </div>
        {reason === "invalid-session" ? (
          <div className="admin-toast error" role="alert">
            当前登录会话对应的管理员已不存在或被停用，请使用有效管理员账号重新登录。
          </div>
        ) : null}
        <AdminLoginForm callbackUrl={callbackUrl || "/admin"} />
      </section>
    </main>
  );
}
