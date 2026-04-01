import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session) {
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
        <AdminLoginForm callbackUrl={callbackUrl || "/admin"} />
      </section>
    </main>
  );
}
