import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";

export default async function JoinUsPage() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: "site" }
  });
  const alumniList = (setting?.alumniNamesZh || "")
    .split(/\r?\n/)
    .map((name: string) => name.trim())
    .filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <h2>加入我们</h2>
              <p className="muted">{setting?.joinIntroZh}</p>
            </div>
          </div>
          <div className="admin-stack">
            <div className="content-card">
              <strong>会员权益</strong>
              <p>{setting?.joinBenefitsZh}</p>
            </div>
            <div className="content-card">
              <strong>纳新海报区说明</strong>
              <p>{setting?.joinPosterNoteZh}</p>
              <a className="button-primary" href={setting?.joinFormUrl || "https://example.com/join"}>
                前往报名
              </a>
            </div>
            <div className="content-card">
              <strong>历届成员</strong>
              {alumniList.length === 0 ? (
                <p className="muted">还没有录入成员名单。</p>
              ) : (
                <div className="alumni-grid">
                  {alumniList.map((name) => (
                    <span className="alumni-chip" key={name}>
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
