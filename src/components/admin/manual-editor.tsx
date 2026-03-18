"use client";

import { useMemo, useRef } from "react";

import { MediaPathField } from "@/components/admin/media-path-field";

type MediaOption = {
  id: string;
  title: string;
  filePath: string;
  category?: string;
};

type ManualEditorProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  mediaOptions?: MediaOption[];
  initialValues?: {
    id?: string;
    slug?: string;
    chapterNo?: string;
    titleZh?: string;
    author?: string | null;
    summaryZh?: string | null;
    sortOrder?: number;
    coverImagePath?: string | null;
    markdownZh?: string;
  };
};

function buildMarkdownImage(title: string, filePath: string) {
  return `![${title}](${filePath})`;
}

export function ManualEditor({ action, submitLabel, mediaOptions = [], initialValues }: ManualEditorProps) {
  const markdownRef = useRef<HTMLTextAreaElement | null>(null);
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

  return (
    <form action={action} className="admin-form">
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}
      {!initialValues?.id ? (
        <label>
          <span>Slug</span>
          <input name="slug" type="text" defaultValue={initialValues?.slug || ""} placeholder="chapter-1" />
        </label>
      ) : null}

      <input type="hidden" name="titleEn" value="" />
      <input type="hidden" name="markdownEn" value="" />

      <div className="admin-form-grid">
        <label>
          <span>章节编号</span>
          <input name="chapterNo" type="text" defaultValue={initialValues?.chapterNo || ""} placeholder="1.1" required />
        </label>
        <label>
          <span>排序值</span>
          <input name="sortOrder" type="number" defaultValue={initialValues?.sortOrder ?? 0} />
        </label>
      </div>

      <label>
        <span>章节标题</span>
        <input name="titleZh" type="text" defaultValue={initialValues?.titleZh || ""} required />
      </label>

      <div className="admin-form-grid">
        <label>
          <span>作者</span>
          <input name="author" type="text" defaultValue={initialValues?.author || ""} placeholder="例如：社团讲义组" />
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
      </div>

      <MediaPathField
        name="coverImagePath"
        label="封面图片"
        value={initialValues?.coverImagePath}
        options={mediaOptions}
        categories={["manual", "shared"]}
      />

      <label>
        <span>Markdown 正文</span>
        <textarea ref={markdownRef} name="markdownZh" rows={14} defaultValue={initialValues?.markdownZh || ""} />
      </label>

      <div className="manual-media-helper">
        <div>
          <strong>手册插图助手</strong>
          <p className="muted">
            先在媒体库上传图片，再从这里点“插入到正文”，系统会自动把 Markdown 图片语法插入到当前光标位置。
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
