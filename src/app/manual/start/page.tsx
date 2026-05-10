import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { MarkdownRenderer } from "@/components/site/markdown-renderer";
import { prisma } from "@/lib/db";

export default async function ManualStartPage() {
  const setting = await prisma.siteSetting.upsert({
    where: { id: "site" },
    create: { id: "site" },
    update: {}
  });

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          <section className="content-card">
            <p className="muted">
              <a href="/manual">天文手册</a> / 内容清单
            </p>
          </section>

          {setting.manualStartMd ? (
            <section className="content-card">
              <MarkdownRenderer content={setting.manualStartMd} />
            </section>
          ) : (
            <section className="content-card">
              <div className="empty-state">还没有配置内容清单，请在后台站点设置中添加。</div>
            </section>
          )}

          <div className="manual-back-link">
            <a className="button-ghost" href="/manual">
              返回手册首页
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
