import { AboutGalleryEditor } from "@/components/admin/about-gallery-editor";
import { AlumniGroupsEditor } from "@/components/admin/alumni-groups-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

import { updateSecondaryContent } from "./actions";

export default async function AdminSettingsPage() {
  await requireAdminSession();

  const [setting, assets] = await Promise.all([
    prisma.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {}
    }),
    prisma.mediaAsset.findMany({
      where: {
        category: {
          in: ["shared", "site", "gallery"]
        }
      },
      orderBy: { createdAt: "desc" },
      take: 200
    })
  ]);

  const mediaOptions = assets.map((asset) => ({
    id: asset.id,
    title: asset.title,
    filePath: asset.filePath,
    category: asset.category
  }));

  return (
    <section className="admin-card">
      <h2>页面内容设置</h2>
      <p className="muted">这里维护各页面说明文案、“关于我们”照片墙，以及历届成员名单。</p>

      <form action={updateSecondaryContent} className="admin-form">
        <label>
          <span>联系邮箱</span>
          <input name="contactEmail" defaultValue={setting.contactEmail} />
        </label>

        <label>
          <span>关于我们介绍</span>
          <textarea name="aboutIntroZh" rows={4} defaultValue={setting.aboutIntroZh} />
        </label>

        <div className="admin-form-grid">
          <label>
            <span>知识科普页面说明</span>
            <textarea name="knowledgeIntroZh" rows={3} defaultValue={setting.knowledgeIntroZh} />
          </label>
          <label>
            <span>社团活动页面说明</span>
            <textarea name="activitiesIntroZh" rows={3} defaultValue={setting.activitiesIntroZh} />
          </label>
        </div>

        <div className="admin-form-grid">
          <label>
            <span>天文摄影页面说明</span>
            <textarea name="galleryIntroZh" rows={3} defaultValue={setting.galleryIntroZh} />
          </label>
          <label>
            <span>天文手册页面说明</span>
            <textarea name="manualIntroZh" rows={3} defaultValue={setting.manualIntroZh} />
          </label>
        </div>

        <label>
          <span>天文手册顶部内容（Markdown）</span>
          <small className="muted">在栏目卡片上方显示的内容，支持 Markdown 格式。留空则显示默认的"第一次来到这里？"引导区。</small>
          <textarea name="manualStartMd" rows={12} defaultValue={setting.manualStartMd} placeholder="# 天协知识手册 · 内容清单&#10;&#10;在这里粘贴 Markdown 内容..." />
        </label>

        <label>
          <span>联系我们页面说明</span>
          <textarea name="contactIntroZh" rows={3} defaultValue={setting.contactIntroZh} />
        </label>

        <div className="admin-form-grid">
          <label>
            <span>学术部门介绍</span>
            <textarea name="academicDeptZh" rows={3} defaultValue={setting.academicDeptZh} />
          </label>
          <label>
            <span>科普部门介绍</span>
            <textarea name="publicDeptZh" rows={3} defaultValue={setting.publicDeptZh} />
          </label>
        </div>

        <label>
          <span>摄影 / 宣传部门介绍</span>
          <textarea name="mediaDeptZh" rows={3} defaultValue={setting.mediaDeptZh} />
        </label>

        <AboutGalleryEditor initialValue={setting.aboutGalleryImagePaths} options={mediaOptions} />

        <AlumniGroupsEditor initialValue={setting.alumniGroupsJson} options={mediaOptions} />

        <button className="button-link" type="submit">
          保存页面内容设置
        </button>
      </form>
    </section>
  );
}
