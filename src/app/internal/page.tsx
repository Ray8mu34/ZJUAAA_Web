import Link from "next/link";
import { Download, Images, LogOut, ScrollText } from "lucide-react";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";
import { hasInternalAccess } from "@/lib/internal-auth";
import { formatRetryAfter } from "@/lib/login-rate-limit";

import { internalSignIn, internalSignOut } from "./actions";

type InternalPageProps = {
  searchParams: Promise<{ error?: string; next?: string; retry?: string }>;
};

function getErrorMessage(error?: string, retry?: string) {
  if (error === "config") {
    return "服务器还没有配置内部资料账号和密码，请先设置 INTERNAL_USERNAME 与 INTERNAL_PASSWORD。";
  }

  if (error === "rate-limited") {
    return `尝试次数过多，请在 ${formatRetryAfter(Number(retry || 60))} 再试。`;
  }

  if (error === "invalid") {
    return "账号或密码不正确，请再试一次。";
  }

  return "";
}

export default async function InternalPage({ searchParams }: InternalPageProps) {
  const params = await searchParams;
  const [hasAccess, setting] = await Promise.all([
    hasInternalAccess(),
    prisma.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {}
    })
  ]);
  const callbackUrl = params.next?.startsWith("/internal") ? params.next : "/internal";
  const errorMessage = getErrorMessage(params.error, params.retry);

  return (
    <>
      <SiteHeader />
      <main className={hasAccess ? "internal-page internal-portal-page" : "internal-page internal-login-page"}>
        <div className="shell">
          {!hasAccess ? (
            <section className="internal-login-panel">
              <header className="internal-login-heading">
                <h1>内部资料</h1>
                <p>
                  仅限社团成员访问。
                  <br />
                  请使用内部账号登录。
                </p>
              </header>

              <form action={internalSignIn} className="internal-login-form">
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <label>
                  <span>账号</span>
                  <input name="username" type="text" autoComplete="username" placeholder="请输入账号" required />
                </label>
                <label>
                  <span>密码</span>
                  <input name="password" type="password" autoComplete="current-password" placeholder="请输入密码" required />
                </label>
                {errorMessage ? <p className="internal-form-error">{errorMessage}</p> : null}
                <button className="internal-login-submit" type="submit">
                  登录
                </button>
              </form>

              <p className="internal-login-help">
                登录遇到问题？<Link href="/contact">联系管理员</Link>
              </p>
            </section>
          ) : (
            <section className="internal-portal">
              <div className="internal-portal-head">
                <div>
                  <h1>内部资料</h1>
                  <p>{setting.internalIntroZh || "这里收纳社团内部文件、宣传部作品和后续可以继续扩展的成员资料。"}</p>
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
                <Link className="internal-module-card" href="/internal/stories">
                  <ScrollText size={24} />
                  <strong>天协往事</strong>
                  <span>随机翻看社团里的短句、片段和回忆，像在星图里拾起几颗旧光点。</span>
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
