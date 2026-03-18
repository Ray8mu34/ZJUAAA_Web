import { MediaPathField } from "@/components/admin/media-path-field";

type MediaOption = {
  id: string;
  title: string;
  filePath: string;
  category?: string;
};

type ActivityEditorProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  mediaOptions?: MediaOption[];
  initialValues?: {
    id?: string;
    titleZh?: string;
    summaryZh?: string | null;
    coverImagePath?: string | null;
    locationZh?: string | null;
    externalUrl?: string | null;
    startAt?: string;
    endAt?: string;
  };
};

function formatDatetimeLocal(value?: string) {
  if (!value) return "";
  return value.slice(0, 16);
}

export function ActivityEditor({ action, submitLabel, mediaOptions = [], initialValues }: ActivityEditorProps) {
  return (
    <form action={action} className="admin-form">
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

      <input type="hidden" name="titleEn" value="" />
      <input type="hidden" name="summaryEn" value="" />
      <input type="hidden" name="locationEn" value="" />

      <label>
        <span>活动标题</span>
        <input name="titleZh" type="text" defaultValue={initialValues?.titleZh || ""} required />
      </label>

      <div className="admin-form-grid">
        <label>
          <span>活动简介</span>
          <input name="summaryZh" type="text" defaultValue={initialValues?.summaryZh || ""} />
        </label>
        <MediaPathField
          name="coverImagePath"
          label="封面图片"
          value={initialValues?.coverImagePath}
          options={mediaOptions}
          categories={["activity", "shared"]}
        />
      </div>

      <label>
        <span>活动地点</span>
        <input name="locationZh" type="text" defaultValue={initialValues?.locationZh || ""} />
      </label>

      <div className="admin-form-grid">
        <label>
          <span>开始时间</span>
          <input name="startAt" type="datetime-local" defaultValue={formatDatetimeLocal(initialValues?.startAt)} />
        </label>
        <label>
          <span>结束时间</span>
          <input name="endAt" type="datetime-local" defaultValue={formatDatetimeLocal(initialValues?.endAt)} />
        </label>
      </div>

      <label>
        <span>活动外部链接</span>
        <input name="externalUrl" type="url" defaultValue={initialValues?.externalUrl || ""} />
      </label>

      <button className="button-link" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
