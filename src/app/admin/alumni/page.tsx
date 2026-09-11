import Link from "next/link";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlumniGroupsEditor } from "@/components/admin/alumni-groups-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { updateAlumniGroups } from "../settings/actions";

export default async function AdminAlumniPage() {
  await requireAdminSession();
  const [setting, assets] = await Promise.all([
    prisma.siteSetting.upsert({ where: { id: "site" }, create: { id: "site" }, update: {} }),
    prisma.mediaAsset.findMany({ where: { category: { in: ["shared", "site", "gallery"] } }, orderBy: { createdAt: "desc" }, take: 200 })
  ]);
  const options = assets.map((asset) => ({ id: asset.id, title: asset.title, filePath: asset.filePath, category: asset.category }));

  return <div className="admin-stack">
    <AdminPageHeader eyebrow="成员管理" title="历届成员" description="按届次切换，以照片墙方式维护姓名、职务和成员照片。">
      <Link className="button-ghost" href="/about/members" target="_blank">前台查看</Link>
    </AdminPageHeader>
    <section className="admin-card admin-alumni-page">
      <AdminActionForm action={updateAlumniGroups} successMessage="历届成员名单已保存。">
        <AlumniGroupsEditor initialValue={setting.alumniGroupsJson} options={options}/>
        <div className="admin-alumni-savebar"><span>所有届次的修改将一次保存</span><button className="button-link" type="submit">保存成员名单</button></div>
      </AdminActionForm>
    </section>
  </div>;
}
