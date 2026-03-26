"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type MediaOption = {
  id: string;
  title: string;
  filePath: string;
  category?: string;
};

function parseInitialValue(initialValue?: string | null) {
  return (initialValue || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AboutGalleryEditor({
  initialValue,
  options
}: {
  initialValue?: string | null;
  options: MediaOption[];
}) {
  const [selected, setSelected] = useState<string[]>(() => parseInitialValue(initialValue));
  const [keyword, setKeyword] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const serialized = useMemo(() => selected.join("\n"), [selected]);

  const filteredOptions = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return options;
    }

    return options.filter((option) => {
      return (
        option.title.toLowerCase().includes(normalizedKeyword) ||
        option.filePath.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [keyword, options]);

  const selectedOptions = selected
    .map((filePath) => options.find((option) => option.filePath === filePath))
    .filter((item): item is MediaOption => Boolean(item));

  const addImage = (filePath: string) => {
    setSelected((current) => (current.includes(filePath) ? current : [...current, filePath]));
  };

  const removeImage = (filePath: string) => {
    setSelected((current) => current.filter((item) => item !== filePath));
  };

  return (
    <div className="admin-gallery-editor">
      <input name="aboutGalleryImagePaths" type="hidden" value={serialized} />

      <div className="admin-gallery-head">
        <div>
          <span>关于我们照片墙</span>
          <p className="muted">先去媒体库上传，再从这里点选加入照片墙。可以随时移除。</p>
        </div>
        <button className="button-ghost" type="button" onClick={() => setIsOpen((open) => !open)}>
          {isOpen ? "收起选图面板" : `打开选图面板 (${filteredOptions.length})`}
        </button>
      </div>

      {selectedOptions.length === 0 ? (
        <div className="empty-state">还没有选择照片墙图片。</div>
      ) : (
        <div className="admin-gallery-selected">
          {selectedOptions.map((option) => (
            <article className="admin-gallery-selected-item" key={option.id}>
              <div className="admin-gallery-selected-thumb">
                <Image alt={option.title} fill sizes="160px" src={option.filePath} />
              </div>
              <strong>{option.title}</strong>
              <p className="muted">{option.filePath}</p>
              <button className="button-ghost danger-text" type="button" onClick={() => removeImage(option.filePath)}>
                移除
              </button>
            </article>
          ))}
        </div>
      )}

      {isOpen ? (
        <div className="media-picker-panel">
          <div className="media-picker-toolbar">
            <input
              className="media-picker-search"
              placeholder="搜索图片标题或路径"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <span className="muted">共 {filteredOptions.length} 张</span>
          </div>

          <div className="media-picker-scroll">
            <div className="media-picker-grid">
              {filteredOptions.map((option) => {
                const active = selected.includes(option.filePath);

                return (
                  <button
                    key={option.id}
                    className={active ? "media-picker-item active" : "media-picker-item"}
                    type="button"
                    onClick={() => (active ? removeImage(option.filePath) : addImage(option.filePath))}
                  >
                    <div className="media-picker-thumb">
                      <Image alt={option.title} fill sizes="96px" src={option.filePath} />
                    </div>
                    <strong>{option.title}</strong>
                    <span>{option.filePath}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
