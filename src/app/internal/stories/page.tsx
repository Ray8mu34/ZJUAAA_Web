import Link from "next/link";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { InternalStoryCloud } from "@/components/site/internal-story-cloud";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";
import { hasInternalAccess } from "@/lib/internal-auth";

import { internalSignOut } from "../actions";

export default async function InternalStoriesPage() {
  if (!(await hasInternalAccess())) {
    redirect(`/internal?next=${encodeURIComponent("/internal/stories")}`);
  }

  const stories = await prisma.internalStory.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });

  return (
    <>
      <SiteHeader />
      <main className="internal-page internal-stories-page">
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

          <InternalStoryCloud
            stories={stories.map((story) => ({
              id: story.id,
              title: story.title,
              content: story.content,
              source: story.source
            }))}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
