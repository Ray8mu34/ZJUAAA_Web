import { InternalStoryEditor } from "@/components/admin/internal-story-editor";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

import { createInternalStory, deleteInternalStory, setInternalStoryStatus, updateInternalStory } from "./actions";

export default async function AdminInternalStoriesPage() {
  await requireAdminSession();

  const stories = await prisma.internalStory.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h2>新增天协往事</h2>
        <p className="muted">维护内部资料中的短文本记忆。前台会随机抽取若干条，像星云碎片一样展示。</p>
        <InternalStoryEditor action={createInternalStory} submitLabel="新增往事" />
      </section>

      <section className="admin-card">
        <h2>已保存往事</h2>
        <div className="admin-stack">
          {stories.length === 0 ? (
            <div className="empty-state">还没有天协往事。先写下一段短短的社团记忆吧。</div>
          ) : (
            stories.map((story) => (
              <details className="post-item post-item-collapsible" key={story.id}>
                <summary className="post-item-summary">
                  <div>
                    <strong>{story.title || story.content.slice(0, 26)}</strong>
                    <div className="post-meta">
                      <span>{story.source || "未填写来源"}</span>
                      <span>排序：{story.sortOrder}</span>
                      <span>状态：{story.status}</span>
                    </div>
                  </div>
                </summary>

                <div className="post-item-body">
                  <InternalStoryEditor
                    action={updateInternalStory}
                    submitLabel="保存修改"
                    initialValues={{
                      id: story.id,
                      title: story.title,
                      content: story.content,
                      source: story.source,
                      sortOrder: story.sortOrder
                    }}
                  />

                  <div className="post-actions">
                    <form action={setInternalStoryStatus}>
                      <input type="hidden" name="id" value={story.id} />
                      <input type="hidden" name="status" value="PUBLISHED" />
                      <button className="button-ghost" type="submit">
                        发布
                      </button>
                    </form>
                    <form action={setInternalStoryStatus}>
                      <input type="hidden" name="id" value={story.id} />
                      <input type="hidden" name="status" value="DRAFT" />
                      <button className="button-ghost" type="submit">
                        设为草稿
                      </button>
                    </form>
                    <a className="button-ghost" href="/internal/stories" target="_blank" rel="noreferrer">
                      前台查看
                    </a>
                    <form action={deleteInternalStory}>
                      <input type="hidden" name="id" value={story.id} />
                      <button className="button-ghost danger-text" type="submit">
                        删除
                      </button>
                    </form>
                  </div>
                </div>
              </details>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
