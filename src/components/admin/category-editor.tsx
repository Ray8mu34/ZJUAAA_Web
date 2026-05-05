"use client";

import { MediaPathField } from "@/components/admin/media-path-field";

type MediaOption = {
  id: string;
  title: string;
  filePath: string;
  category?: string;
};

type CategoryEditorProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  mediaOptions?: MediaOption[];
  initialValues?: {
    id?: string;
    slug?: string;
    titleZh?: string;
    summaryZh?: string;
    sortOrder?: number;
    coverImagePath?: string | null;
    isVisible?: boolean;
  };
};

export function CategoryEditor({ action, submitLabel, mediaOptions = [], initialValues }: CategoryEditorProps) {
  return (
    <form action={action} className="admin-form">
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

      {!initialValues?.id ? (
        <label>
          <span>Slug（URL标识）</span>
          <input name="slug" type="text" defaultValue={initialValues?.slug || ""} placeholder="observation" />
          <small className="muted">用于 URL 路径，只能包含英文、数字和连字符。留空则自动生成。</small>
        </label>
      ) : null}

      <div className="admin-form-grid">
        <label>
          <span>栏目标题</span>
          <input name="titleZh" type="text" defaultValue={initialValues?.titleZh || ""} placeholder="观测手册" required />
        </label>
        <label>
          <span>排序值</span>
          <input name="sortOrder" type="number" defaultValue={initialValues?.sortOrder ?? 0} />
          <small className="muted">数字越小越靠前。</small>
        </label>
      </div>

      <label>
        <span>栏目简介</span>
        <input name="summaryZh" type="text" defaultValue={initialValues?.summaryZh || ""} placeholder="用于栏目卡片展示的简要说明" />
      </label>

      <MediaPathField
        name="coverImagePath"
        label="栏目封面图"
        value={initialValues?.coverImagePath}
        options={mediaOptions}
        categories={["manual", "shared"]}
      />

      <label className="admin-checkbox-row">
        <input type="checkbox" name="isVisible" defaultChecked={initialValues?.isVisible !== false} />
        <span>对外可见（取消勾选则前台不展示此栏目）</span>
      </label>

      <button className="button-link" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
