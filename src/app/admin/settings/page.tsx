import { prisma } from "@/lib/db";

import { updateSecondaryContent } from "./actions";

export default async function AdminSettingsPage() {
  const setting = await prisma.siteSetting.upsert({
    where: { id: "site" },
    create: { id: "site" },
    update: {}
  });

  return (
    <section className="admin-card">
      <h2>次级页面内容设置</h2>
      <p className="muted">这里用于维护关于我们、加入我们和联系我们页面的主要文字内容。</p>
      <form action={updateSecondaryContent} className="admin-form">
        <label>
          <span>联系邮箱</span>
          <input name="contactEmail" defaultValue={setting.contactEmail} />
        </label>
        <label>
          <span>关于我们简介（中文）</span>
          <textarea name="aboutIntroZh" rows={5} defaultValue={setting.aboutIntroZh} />
        </label>
        <label>
          <span>关于我们简介（英文）</span>
          <textarea name="aboutIntroEn" rows={4} defaultValue={setting.aboutIntroEn} />
        </label>
        <label>
          <span>学术部介绍</span>
          <textarea name="academicDeptZh" rows={3} defaultValue={setting.academicDeptZh} />
        </label>
        <label>
          <span>公关部介绍</span>
          <textarea name="publicDeptZh" rows={3} defaultValue={setting.publicDeptZh} />
        </label>
        <label>
          <span>宣传部介绍</span>
          <textarea name="mediaDeptZh" rows={3} defaultValue={setting.mediaDeptZh} />
        </label>
        <label>
          <span>加入我们简介</span>
          <textarea name="joinIntroZh" rows={4} defaultValue={setting.joinIntroZh} />
        </label>
        <label>
          <span>会员权益</span>
          <textarea name="joinBenefitsZh" rows={4} defaultValue={setting.joinBenefitsZh} />
        </label>
        <label>
          <span>纳新海报说明</span>
          <textarea name="joinPosterNoteZh" rows={3} defaultValue={setting.joinPosterNoteZh} />
        </label>
        <label>
          <span>历届成员名单（每行一个）</span>
          <textarea name="alumniNamesZh" rows={8} defaultValue={setting.alumniNamesZh} />
        </label>
        <button className="button-link" type="submit">
          保存页面内容
        </button>
      </form>
    </section>
  );
}
