import { MediaPathField } from "@/components/admin/media-path-field";

type MediaOption = {
  id: string;
  title: string;
  filePath: string;
  category?: string;
};

type PostEditorProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  mediaOptions?: MediaOption[];
  initialValues?: {
    id?: string;
    slug?: string;
    titleZh?: string;
    summaryZh?: string | null;
    author?: string;
    coverImagePath?: string | null;
    externalUrl?: string | null;
  };
};

export function PostEditor({ action, submitLabel, mediaOptions = [], initialValues }: PostEditorProps) {
  return (
    <form action={action} className="admin-form">
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}
      {!initialValues?.id ? (
        <label>
          <span>Slug</span>
          <input name="slug" type="text" defaultValue={initialValues?.slug || ""} placeholder="knowledge-post" />
        </label>
      ) : null}

      <input type="hidden" name="titleEn" value="" />
      <input type="hidden" name="summaryEn" value="" />

      <label>
        <span>文章标题</span>
        <input name="titleZh" type="text" defaultValue={initialValues?.titleZh || ""} required />
      </label>

      <div className="admin-form-grid">
        <label>
          <span>作者</span>
          <input name="author" type="text" defaultValue={initialValues?.author || ""} required />
        </label>
        <MediaPathField
          name="coverImagePath"
          label="封面图片"
          value={initialValues?.coverImagePath}
          options={mediaOptions}
          categories={["knowledge", "shared"]}
        />
      </div>

      <label>
        <span>摘要</span>
        <input name="summaryZh" type="text" defaultValue={initialValues?.summaryZh || ""} />
      </label>

      <label>
        <span>公众号文章链接</span>
        <input
          name="externalUrl"
          type="url"
          defaultValue={initialValues?.externalUrl || ""}
          placeholder="https://mp.weixin.qq.com/..."
        />
      </label>

      <button className="button-link" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
