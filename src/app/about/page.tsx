import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

export default async function AboutPage() {
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
              <h2>关于我们</h2>
              <p className="muted">{setting?.aboutIntroZh}</p>
            </div>
          </div>
          <div className="cards-grid">
            <article className="content-card">
              <strong>学术部</strong>
              <p>{setting?.academicDeptZh}</p>
            </article>
            <article className="content-card">
              <strong>公关部</strong>
              <p>{setting?.publicDeptZh}</p>
            </article>
            <article className="content-card">
              <strong>宣传部</strong>
              <p>{setting?.mediaDeptZh}</p>
            </article>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
