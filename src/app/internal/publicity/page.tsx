import Link from "next/link";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { PublicityShowcase } from "@/components/site/publicity-showcase";
import { prisma } from "@/lib/db";
import { hasInternalAccess } from "@/lib/internal-auth";

import { internalSignOut } from "../actions";

function formatWorkDate(value: Date | null) {
  if (!value) return null;
  return value.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default async function InternalPublicityPage() {
  if (!(await hasInternalAccess())) {
    redirect(`/internal?next=${encodeURIComponent("/internal/publicity")}`);
  }

  const works = await prisma.publicityWork.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { workDate: "desc" }, { updatedAt: "desc" }]
  });

  return (
    <>
      <SiteHeader />
      <main className="internal-page internal-publicity-page">
        <div className="shell">
          <section className="publicity-toolbar">
            <Link className="internal-back-link" href="/internal">
              内部资料
            </Link>
            <form action={internalSignOut}>
              <button className="button-ghost internal-logout" type="submit">
                <LogOut size={18} />
                退出
              </button>
            </form>
          </section>

          <PublicityShowcase
            works={works.map((work) => ({
              id: work.id,
              title: work.title,
              imagePath: work.imagePath,
              author: work.author || "天小协",
              descriptionZh: work.descriptionZh,
              workDate: formatWorkDate(work.workDate)
            }))}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
