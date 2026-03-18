import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

export default async function ContactPage() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: "site" }
  });

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <h2>联系我们</h2>
              <p className="muted">联系方式会从站点设置中读取，后续可直接在后台修改。</p>
            </div>
          </div>
          <div className="cards-grid">
            <article className="content-card">
              <strong>微信号</strong>
              <p>{setting?.wechatLabel || "ZJUAAA_"}</p>
            </article>
            <article className="content-card">
              <strong>QQ</strong>
              <p>{setting?.qqLabel || "3389651066"}</p>
            </article>
            <article className="content-card">
              <strong>邮箱</strong>
              <p>{setting?.contactEmail || "contact@example.com"}</p>
            </article>
            <article className="content-card">
              <strong>联系地址</strong>
              <p>{setting?.addressZh || "浙江大学紫金港校区东四教学楼 502-1"}</p>
            </article>
          </div>
          <div className="section" />
          <a className="button-primary" href={setting?.contactFormUrl || "https://example.com/contact"}>
            前往联系表单
          </a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
