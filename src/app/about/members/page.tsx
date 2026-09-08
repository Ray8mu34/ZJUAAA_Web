import { AboutSectionShell } from "@/components/site/about-section-shell";
import { AlumniBrowser } from "@/components/site/alumni-browser";
import { parseAlumniGroups, sortAlumniGroups } from "@/lib/about-content";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AboutMembersPage() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: "site" },
    select: { aboutIntroZh: true, alumniGroupsJson: true }
  });
  const alumniGroups = sortAlumniGroups(parseAlumniGroups(setting?.alumniGroupsJson));

  return (
    <AboutSectionShell active="members" introduction={setting?.aboutIntroZh}>
      <section className="about-members-content" aria-labelledby="about-members-title" data-reveal>
        <div className="about-content-heading">
          <h2 id="about-members-title">历届成员</h2>
        </div>

        {alumniGroups.length === 0 ? (
          <div className="empty-state">还没有录入历届成员数据。</div>
        ) : (
          <AlumniBrowser groups={alumniGroups} />
        )}
      </section>
    </AboutSectionShell>
  );
}
