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
              <p className="muted">
                {setting?.contactIntroZh || "欢迎通过微信、QQ、邮箱或报名表单与我们取得联系。"}
              </p>
            </div>
          </div>

          <div className="cards-grid">
            <article className="content-card">
              <strong>微信公众号</strong>
              <p>{setting?.wechatLabel || "ZJUAAA_"}</p>
            </article>
            <article className="content-card">
              <strong>QQ</strong>
              <p>{setting?.qqLabel || "3389651066"}</p>
            </article>
            <article className="content-card">
              <strong>联系邮箱</strong>
              <p>{setting?.contactEmail || "contact@example.com"}</p>
            </article>
            <article className="content-card">
              <strong>联系地址</strong>
              <p>{setting?.addressZh || "浙江大学紫金港校区"}</p>
            </article>
          </div>

          <div className="contact-cta-row">
            <a
              className="button-primary"
              href={setting?.joinFormUrl || "https://example.com/join"}
              rel="noreferrer"
              target="_blank"
            >
              填写纳新报名表单
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
