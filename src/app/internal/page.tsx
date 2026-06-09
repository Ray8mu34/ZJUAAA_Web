import Link from "next/link";
import { Download, Images, LockKeyhole, LogOut } from "lucide-react";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { hasInternalAccess } from "@/lib/internal-auth";

import { internalSignIn, internalSignOut } from "./actions";

type InternalPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

function getErrorMessage(error?: string) {
  if (error === "config") {
    return "服务器还没有配置内部资料账号和密码，请先设置 INTERNAL_USERNAME 与 INTERNAL_PASSWORD。";
  }

  if (error === "invalid") {
    return "账号或密码不正确，请再试一次。";
  }

  return "";
}

export default async function InternalPage({ searchParams }: InternalPageProps) {
  const params = await searchParams;
  const hasAccess = await hasInternalAccess();
  const callbackUrl = params.next?.startsWith("/internal") ? params.next : "/internal";
  const errorMessage = getErrorMessage(params.error);

  return (
    <>
      <SiteHeader />
      <main className="internal-page">
        <div className="shell">
          {!hasAccess ? (
            <section className="internal-login-panel">
              <div className="internal-login-copy">
                <span className="internal-kicker">
                  <LockKeyhole size={18} />
                  内部资料
                </span>
                <h1>成员资料入口</h1>
                <p>输入内部资料账号和密码后，可以查看社团资料下载、宣传部作品等仅供内部使用的内容。</p>
              </div>

              <form action={internalSignIn} className="internal-login-form">
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <label>
                  <span>账号</span>
                  <input name="username" type="text" autoComplete="username" placeholder="内部资料账号" required />
                </label>
                <label>
                  <span>密码</span>
                  <input name="password" type="password" autoComplete="current-password" placeholder="内部资料密码" required />
                </label>
                {errorMessage ? <p className="internal-form-error">{errorMessage}</p> : null}
                <button className="button-link" type="submit">
                  进入内部资料
                </button>
              </form>
            </section>
          ) : (
            <section className="internal-portal">
              <div className="internal-portal-head">
                <div>
                  <span className="internal-kicker">ZJUAAA Internal</span>
                  <h1>内部资料</h1>
                  <p>这里收纳社团内部文件、宣传部作品和后续可以继续扩展的成员资料。</p>
                </div>
                <form action={internalSignOut}>
                  <button className="button-ghost internal-logout" type="submit">
                    <LogOut size={18} />
                    退出
                  </button>
                </form>
              </div>

              <div className="internal-module-grid">
                <Link className="internal-module-card" href="/internal/files">
                  <Download size={24} />
                  <strong>文件下载</strong>
                  <span>望远镜操作视频、图文资料、表格与培训文件。</span>
                </Link>
                <Link className="internal-module-card" href="/internal/publicity">
                  <Images size={24} />
                  <strong>宣传部作品</strong>
                  <span>海报、传单、纳新视觉和社团传播物料作品墙。</span>
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
