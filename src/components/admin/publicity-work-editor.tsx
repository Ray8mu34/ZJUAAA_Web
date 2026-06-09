import { MediaPathField } from "@/components/admin/media-path-field";

type MediaOption = {
  id: string;
  title: string;
  filePath: string;
  category?: string;
};

type PublicityWorkEditorProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  mediaOptions?: MediaOption[];
  initialValues?: {
    id?: string;
    title?: string;
    imagePath?: string | null;
    descriptionZh?: string | null;
    workDate?: Date | null;
    sortOrder?: number;
  };
};

function formatDateInput(value?: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export function PublicityWorkEditor({ action, submitLabel, mediaOptions = [], initialValues }: PublicityWorkEditorProps) {
  return (
    <form action={action} className="admin-form">
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

      <div className="admin-form-grid">
        <label>
          <span>作品标题</span>
          <input name="title" type="text" defaultValue={initialValues?.title || ""} placeholder="例如：社团纳新海报" />
        </label>
        <label>
          <span>作品日期</span>
          <input name="workDate" type="date" defaultValue={formatDateInput(initialValues?.workDate)} />
        </label>
      </div>

      <div className="admin-form-grid">
        <label>
          <span>{initialValues?.id ? "上传新图片（可选）" : "直接上传图片"}</span>
          <input className="file-input" name="imageFile" type="file" accept="image/*" />
        </label>
        <label>
          <span>排序值</span>
          <input name="sortOrder" type="number" defaultValue={initialValues?.sortOrder ?? 0} />
        </label>
      </div>

      <MediaPathField
        name="imagePath"
        label="或从媒体库选择图片"
        value={initialValues?.imagePath}
        options={mediaOptions}
        categories={["publicity", "internal", "shared"]}
        emptyMessage="媒体库里还没有宣传部作品图片，也可以直接在上方上传。"
      />

      <label>
        <span>说明文本</span>
        <textarea name="descriptionZh" rows={5} defaultValue={initialValues?.descriptionZh || ""} placeholder="展示在前台磨砂文本框中的说明。" />
      </label>

      <button className="button-link" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
