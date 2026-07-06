import { AdminPaginationLinks } from "@/components/admin/admin-pagination-links";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { ActivityEditor } from "@/components/admin/activity-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

import {
  createActivityNotice,
  deleteActivityNotice,
  setActivityNoticeStatus,
  updateActivityNotice
} from "./actions";

function formatTime(value: Date | null) {
  if (!value) return "未设置";
  return value.toLocaleString("zh-CN");
}

const PAGE_SIZE = 20;

export default async function AdminActivitiesPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminSession();
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(String(page || "1"), 10) || 1);

  const [notices, totalNotices, assets] = await Promise.all([
    prisma.activityNotice.findMany({
      orderBy: [{ startAt: "asc" }, { updatedAt: "desc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.activityNotice.count(),
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  const mediaOptions = assets.map((asset) => ({
    id: asset.id,
    title: asset.title,
    filePath: asset.filePath,
    category: asset.category
  }));
  const totalPages = Math.max(1, Math.ceil(totalNotices / PAGE_SIZE));

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h2>新增社团活动</h2>
        <p className="muted">填写标题、简介、时间、地点、封面和外部链接后，发布即可展示在前台活动列表。</p>
        <ActivityEditor action={createActivityNotice} submitLabel="新增社团活动" mediaOptions={mediaOptions} />
      </section>

      <section className="admin-card">
        <h2>已保存内容</h2>
        <div className="admin-stack">
          {notices.length === 0 ? (
            <div className="empty-state">还没有活动预告。先新增一条，保存后这里就会出现可编辑的条目。</div>
          ) : (
            notices.map((notice) => (
              <details className="post-item post-item-collapsible" key={notice.id}>
                <summary className="post-item-summary">
                  <div>
                    <strong>{notice.titleZh}</strong>
                    <div className="post-meta">
                      <span>状态：{notice.status}</span>
                      <span>地点：{notice.locationZh || "未设置"}</span>
                      <span>开始时间：{formatTime(notice.startAt)}</span>
                    </div>
                  </div>
                </summary>

                <div className="post-item-body">
                  <ActivityEditor
                    action={updateActivityNotice}
                    submitLabel="保存修改"
                    mediaOptions={mediaOptions}
                    initialValues={{
                      id: notice.id,
                      titleZh: notice.titleZh,
                      summaryZh: notice.summaryZh,
                      coverImagePath: notice.coverImagePath,
                      locationZh: notice.locationZh,
                      externalUrl: notice.externalUrl,
                      startAt: notice.startAt?.toISOString(),
                      endAt: notice.endAt?.toISOString()
                    }}
                  />

                  <div className="post-actions">
                    <AdminActionForm action={setActivityNoticeStatus} className="" successMessage="活动已发布。">
                      <input type="hidden" name="id" value={notice.id} />
                      <input type="hidden" name="status" value="PUBLISHED" />
                      <button className="button-ghost" type="submit">
                        发布
                      </button>
                    </AdminActionForm>
                    <AdminActionForm action={setActivityNoticeStatus} className="" successMessage="活动已设为草稿。">
                      <input type="hidden" name="id" value={notice.id} />
                      <input type="hidden" name="status" value="DRAFT" />
                      <button className="button-ghost" type="submit">
                        设为草稿
                      </button>
                    </AdminActionForm>
                    <AdminActionForm
                      action={deleteActivityNotice}
                      className=""
                      successMessage="活动已删除。"
                      confirmMessage={`确认删除活动「${notice.titleZh}」？`}
                    >
                      <input type="hidden" name="id" value={notice.id} />
                      <button className="button-ghost danger-text" type="submit">
                        删除
                      </button>
                    </AdminActionForm>
                  </div>
                </div>
              </details>
            ))
          )}
          <AdminPaginationLinks basePath="/admin/activities" currentPage={currentPage} totalPages={totalPages} />
        </div>
      </section>
    </div>
  );
}
