type InternalStoryEditorProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  initialValues?: {
    id?: string;
    title?: string | null;
    content?: string | null;
    source?: string | null;
    sortOrder?: number;
  };
};

export function InternalStoryEditor({ action, submitLabel, initialValues }: InternalStoryEditorProps) {
  return (
    <form action={action} className="admin-form">
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

      <div className="admin-form-grid">
        <label>
          <span>标题（可选）</span>
          <input name="title" type="text" defaultValue={initialValues?.title || ""} placeholder="例如：第一次冷湖远征" />
        </label>
        <label>
          <span>来源 / 年份（可选）</span>
          <input name="source" type="text" defaultValue={initialValues?.source || ""} placeholder="例如：2023 秋 / 某位社员" />
        </label>
      </div>

      <label>
        <span>往事文本</span>
        <textarea name="content" rows={6} defaultValue={initialValues?.content || ""} placeholder="写一段短短的社团记忆、幕后故事、口头禅或活动片段。" required />
      </label>

      <label>
        <span>排序值</span>
        <input name="sortOrder" type="number" defaultValue={initialValues?.sortOrder ?? 0} />
      </label>

      <button className="button-link" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
