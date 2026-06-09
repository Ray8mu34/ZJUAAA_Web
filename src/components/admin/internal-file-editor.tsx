type InternalFileEditorProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  initialValues?: {
    id?: string;
    title?: string;
    description?: string | null;
    category?: string | null;
    sortOrder?: number;
  };
};

export function InternalFileEditor({ action, submitLabel, initialValues }: InternalFileEditorProps) {
  return (
    <form action={action} className="admin-form">
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

      <div className="admin-form-grid">
        <label>
          <span>资料名称</span>
          <input name="title" type="text" defaultValue={initialValues?.title || ""} placeholder="例如：望远镜操作视频" />
        </label>
        <label>
          <span>分类</span>
          <input name="category" type="text" defaultValue={initialValues?.category || ""} placeholder="例如：器材 / 培训 / 表格" />
        </label>
      </div>

      <div className="admin-form-grid">
        <label>
          <span>{initialValues?.id ? "替换文件（可选）" : "上传文件"}</span>
          <input className="file-input" name="file" type="file" required={!initialValues?.id} />
        </label>
        <label>
          <span>排序值</span>
          <input name="sortOrder" type="number" defaultValue={initialValues?.sortOrder ?? 0} />
        </label>
      </div>

      <label>
        <span>说明</span>
        <textarea name="description" rows={4} defaultValue={initialValues?.description || ""} placeholder="给成员看的简短说明，可不填。" />
      </label>

      <button className="button-link" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
