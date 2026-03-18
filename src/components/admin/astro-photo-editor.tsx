import { MediaPathField } from "@/components/admin/media-path-field";

type MediaOption = {
  id: string;
  title: string;
  filePath: string;
  category?: string;
};

type AstroPhotoEditorProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  mediaOptions?: MediaOption[];
  initialValues?: {
    id?: string;
    slug?: string;
    titleZh?: string;
    photographer?: string;
    imagePath?: string | null;
    descriptionZh?: string | null;
    skyRegionZh?: string | null;
    locationZh?: string | null;
    equipmentMainLens?: string | null;
    equipmentCamera?: string | null;
    equipmentMount?: string | null;
    equipmentFilter?: string | null;
    equipmentSoftware?: string | null;
  };
};

export function AstroPhotoEditor({ action, submitLabel, mediaOptions = [], initialValues }: AstroPhotoEditorProps) {
  return (
    <form action={action} className="admin-form">
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}
      {!initialValues?.id ? (
        <label>
          <span>Slug</span>
          <input name="slug" type="text" defaultValue={initialValues?.slug || ""} placeholder="m42" />
        </label>
      ) : null}

      <input type="hidden" name="titleEn" value="" />
      <input type="hidden" name="descriptionEn" value="" />
      <input type="hidden" name="skyRegionEn" value="" />
      <input type="hidden" name="locationEn" value="" />

      <div className="admin-form-grid">
        <label>
          <span>作品标题</span>
          <input name="titleZh" type="text" defaultValue={initialValues?.titleZh || ""} required />
        </label>
        <label>
          <span>摄影者</span>
          <input name="photographer" type="text" defaultValue={initialValues?.photographer || ""} required />
        </label>
      </div>

      <MediaPathField
        name="imagePath"
        label="作品图片"
        value={initialValues?.imagePath}
        options={mediaOptions}
        categories={["gallery", "shared"]}
      />

      <div className="admin-form-grid">
        <label>
          <span>天区 / 目标</span>
          <input name="skyRegionZh" type="text" defaultValue={initialValues?.skyRegionZh || ""} />
        </label>
        <label>
          <span>拍摄地点</span>
          <input name="locationZh" type="text" defaultValue={initialValues?.locationZh || ""} />
        </label>
      </div>

      <label>
        <span>作品简介</span>
        <textarea name="descriptionZh" rows={5} defaultValue={initialValues?.descriptionZh || ""} />
      </label>

      <div className="admin-form-grid">
        <label>
          <span>主镜 / 镜头</span>
          <input name="equipmentMainLens" type="text" defaultValue={initialValues?.equipmentMainLens || ""} />
        </label>
        <label>
          <span>相机</span>
          <input name="equipmentCamera" type="text" defaultValue={initialValues?.equipmentCamera || ""} />
        </label>
      </div>

      <div className="admin-form-grid">
        <label>
          <span>赤道仪 / 跟踪设备</span>
          <input name="equipmentMount" type="text" defaultValue={initialValues?.equipmentMount || ""} />
        </label>
        <label>
          <span>滤镜</span>
          <input name="equipmentFilter" type="text" defaultValue={initialValues?.equipmentFilter || ""} />
        </label>
      </div>

      <label>
        <span>后期软件</span>
        <input name="equipmentSoftware" type="text" defaultValue={initialValues?.equipmentSoftware || ""} />
      </label>

      <button className="button-link" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
