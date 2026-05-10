"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type MediaOption = {
  id: string;
  title: string;
  filePath: string;
  category?: string;
};

type CategoryOption = {
  id: string;
  slug: string;
  titleZh: string;
};

type ManualEditorProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  mediaOptions?: MediaOption[];
  categories?: CategoryOption[];
  initialValues?: {
    id?: string;
    slug?: string;
    categoryId?: string;
    titleZh?: string;
    author?: string | null;
    summaryZh?: string | null;
    sortOrder?: number;
    markdownZh?: string;
  };
};

function buildMarkdownImage(title: string, filePath: string) {
  return `![${title}](${filePath})`;
}

export function ManualEditor({ action, submitLabel, mediaOptions = [], categories = [], initialValues }: ManualEditorProps) {
  const markdownRef = useRef<HTMLTextAreaElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const insertableOptions = useMemo(
    () => mediaOptions.filter((option) => ["manual", "shared"].includes(option.category || "shared")),
    [mediaOptions]
  );

  function insertImageSyntax(title: string, filePath: string) {
    const textarea = markdownRef.current;
    if (!textarea) return;

    const syntax = buildMarkdownImage(title, filePath);
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = textarea.value.slice(0, start);
    const selected = textarea.value.slice(start, end);
    const after = textarea.value.slice(end);
    const prefix = before && !before.endsWith("\n") ? "\n" : "";
    const suffix = after && !after.startsWith("\n") ? "\n" : "";
    const inserted = `${prefix}${syntax}${selected ? `\n${selected}` : ""}${suffix}`;

    textarea.value = `${before}${inserted}${after}`;
    const caret = before.length + prefix.length + syntax.length;
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
  }

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "manual");

      const res = await fetch("/admin/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "上传失败");
        return;
      }

      const title = file.name.replace(/\.[^.]+$/, "");
      insertImageSyntax(title, data.filePath);
    } catch {
      alert("上传出错，请重试。");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLTextAreaElement>) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files);
      const imageFile = files.find((f) => f.type.startsWith("image/"));
      if (imageFile) {
        handleUpload(imageFile);
      }
    },
    [handleUpload]
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(event.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          handleUpload(file);
        }
      }
    },
    [handleUpload]
  );

  return (
    <form action={action} className="admin-form">
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}
      {!initialValues?.id ? <input type="hidden" name="slug" value="" /> : null}

      <input type="hidden" name="titleEn" value="" />
      <input type="hidden" name="markdownEn" value="" />

      <label>
        <span>所属栏目</span>
        <select name="categoryId" defaultValue={initialValues?.categoryId || ""} required>
          <option value="" disabled>
            请选择栏目
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.titleZh}
            </option>
          ))}
        </select>
      </label>

      <div className="admin-form-grid">
        <label>
          <span>排序值</span>
          <input name="sortOrder" type="number" defaultValue={initialValues?.sortOrder ?? 0} />
          <small className="muted">数字越小越靠前，不填则按创建时间排序。</small>
        </label>
        <label>
          <span>作者</span>
          <input name="author" type="text" defaultValue={initialValues?.author || ""} placeholder="例如：社团讲义组" />
        </label>
      </div>

      <label>
        <span>章节标题</span>
        <input name="titleZh" type="text" defaultValue={initialValues?.titleZh || ""} required />
      </label>

      <label>
        <span>简介</span>
        <input
          name="summaryZh"
          type="text"
          defaultValue={initialValues?.summaryZh || ""}
          placeholder="用于目录页和详情页开头的简要说明"
        />
      </label>

      <label>
        <span>Markdown 正文</span>
        <small className="muted">支持拖拽图片或粘贴截图自动上传。也可从下方插图助手选择已有图片。</small>
        <textarea
          ref={markdownRef}
          name="markdownZh"
          rows={14}
          defaultValue={initialValues?.markdownZh || ""}
          onDrop={handleDrop}
          onPaste={handlePaste}
          placeholder="在此输入 Markdown 正文..."
        />
        {uploading ? <small className="muted">正在上传图片...</small> : null}
      </label>

      <div className="manual-media-helper">
        <div>
          <strong>手册插图助手</strong>
          <p className="muted">
            先在媒体库上传图片，再从这里点"插入到正文"，系统会自动把 Markdown 图片语法插入到当前光标位置。也可以直接在上方编辑器中拖拽或粘贴图片。
          </p>
        </div>

        {insertableOptions.length === 0 ? (
          <div className="empty-state">媒体库里还没有可用于手册的图片。先去媒体库上传后，这里就会出现可插入的图片。</div>
        ) : (
          <div className="manual-media-scroll">
            <div className="manual-media-grid">
              {insertableOptions.map((option) => (
                <article className="manual-media-card" key={option.id}>
                  <div className="manual-media-meta">
                    <strong>{option.title}</strong>
                    <p className="muted">{option.filePath}</p>
                  </div>
                  <button
                    className="button-ghost"
                    type="button"
                    onClick={() => insertImageSyntax(option.title, option.filePath)}
                  >
                    插入到正文
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      <button className="button-link" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
