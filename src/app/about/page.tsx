import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { AlumniBrowser } from "@/components/site/alumni-browser";
import { prisma } from "@/lib/db";

type AlumniGroup = {
  year: string;
  members: Array<{
    name: string;
    role: string;
    photoPath?: string;
  }>;
};

function parseGalleryPaths(raw?: string | null) {
  return (raw || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAlumniGroups(raw?: string | null): AlumniGroup[] {
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((group) => {
        const year = typeof group?.year === "string" ? group.year.trim() : "";
        const members = Array.isArray(group?.members)
          ? group.members
              .map((member: unknown) => {
                const item = member as { name?: unknown; role?: unknown };

                return {
                  name: typeof item?.name === "string" ? item.name.trim() : "",
                  role: typeof item?.role === "string" ? item.role.trim() : "",
                  photoPath: typeof (item as { photoPath?: unknown })?.photoPath === "string"
                    ? String((item as { photoPath?: string }).photoPath).trim()
                    : ""
                };
              })
              .filter((member: { name: string; role: string; photoPath?: string }) => member.name)
          : [];

        return { year, members };
      })
      .filter((group) => group.year && group.members.length > 0);
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: "site" }
  });

  const galleryPaths = parseGalleryPaths(setting?.aboutGalleryImagePaths);
  const alumniGroups = parseAlumniGroups(setting?.alumniGroupsJson);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <h2>关于我们</h2>
              <p className="muted">
                {setting?.aboutIntroZh || "这里展示社团介绍、内部活动照片和历届成员信息。"}
              </p>
            </div>
          </div>

          <section className="content-card about-gallery-section">
            <div className="about-section-head">
              <div>
                <strong>社团照片墙</strong>
                <p className="muted">上传到媒体库后，把图片路径填到后台这里会自动排列展示。</p>
              </div>
              <span className="muted">共 {galleryPaths.length} 张</span>
            </div>

            {galleryPaths.length === 0 ? (
              <div className="empty-state">还没有配置照片墙图片，先去媒体库上传，再到后台站点设置里填写路径。</div>
            ) : (
              <div className="about-gallery-window">
                <div className="about-gallery-masonry">
                  {galleryPaths.map((path, index) => (
                    <figure className="about-gallery-item" key={`${path}-${index}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt={`社团照片 ${index + 1}`} loading="lazy" src={path} />
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="content-card about-alumni-section">
            <div className="about-section-head">
              <div>
                <strong>历届成员名单</strong>
                <p className="muted">在后台按年份维护姓名和职务，前台会自动生成切换按钮。</p>
              </div>
            </div>

            {alumniGroups.length === 0 ? (
              <div className="empty-state">还没有录入历届成员数据。</div>
            ) : (
              <AlumniBrowser groups={alumniGroups} />
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
