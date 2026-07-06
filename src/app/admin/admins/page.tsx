import { AdminActionForm } from "@/components/admin/admin-action-form";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

import { createAdminUser, resetAdminPassword, setAdminStatus, updateAdminProfile } from "./actions";

export default async function AdminAdminsPage() {
  await requireAdminSession();

  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h2>新增管理员</h2>
        <p className="muted">第一阶段先支持新增账号、修改显示名、重置密码和停用账号。</p>
        <AdminActionForm action={createAdminUser} successMessage="管理员已创建。" resetOnSuccess>
          <div className="admin-form-grid">
            <label>
              <span>用户名</span>
              <input name="username" type="text" placeholder="editor01" required />
            </label>
            <label>
              <span>显示名</span>
              <input name="displayName" type="text" placeholder="内容编辑同学" required />
            </label>
          </div>
          <label>
            <span>初始密码</span>
            <input name="password" type="password" placeholder="请输入初始密码" required />
          </label>
          <button className="button-link" type="submit">
            创建管理员
          </button>
        </AdminActionForm>
      </section>

      <section className="admin-card">
        <h2>现有管理员</h2>
        <div className="admin-stack">
          {admins.map((admin) => (
            <article className="post-item" key={admin.id}>
              <div className="post-item-header">
                <div>
                  <h3>{admin.displayName}</h3>
                  <div className="post-meta">
                    <span>用户名: {admin.username}</span>
                    <span>状态: {admin.status}</span>
                    <span>
                      最近登录:
                      {admin.lastLoginAt ? admin.lastLoginAt.toLocaleString("zh-CN") : " 暂无记录"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="admin-form-grid">
                <AdminActionForm action={updateAdminProfile} className="admin-form compact-form" successMessage="显示名已保存。">
                  <input type="hidden" name="id" value={admin.id} />
                  <label>
                    <span>显示名</span>
                    <input name="displayName" type="text" defaultValue={admin.displayName} required />
                  </label>
                  <button className="button-ghost" type="submit">
                    保存显示名
                  </button>
                </AdminActionForm>

                <AdminActionForm
                  action={resetAdminPassword}
                  className="admin-form compact-form"
                  successMessage="密码已重置。"
                  confirmMessage={`确认重置管理员「${admin.username}」的密码？`}
                >
                  <input type="hidden" name="id" value={admin.id} />
                  <label>
                    <span>重置密码</span>
                    <input name="password" type="password" placeholder="输入新密码" required />
                  </label>
                  <button className="button-ghost" type="submit">
                    重置密码
                  </button>
                </AdminActionForm>
              </div>

              <div className="post-actions">
                {admin.status === "ACTIVE" ? (
                  <AdminActionForm
                    action={setAdminStatus}
                    className=""
                    successMessage="管理员已停用。"
                    confirmMessage={`确认停用管理员「${admin.username}」？`}
                  >
                    <input type="hidden" name="id" value={admin.id} />
                    <input type="hidden" name="status" value="DISABLED" />
                    <button className="button-ghost danger-text" type="submit">
                      停用账号
                    </button>
                  </AdminActionForm>
                ) : (
                  <AdminActionForm action={setAdminStatus} className="" successMessage="管理员已重新启用。">
                    <input type="hidden" name="id" value={admin.id} />
                    <input type="hidden" name="status" value="ACTIVE" />
                    <button className="button-ghost" type="submit">
                      重新启用
                    </button>
                  </AdminActionForm>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
