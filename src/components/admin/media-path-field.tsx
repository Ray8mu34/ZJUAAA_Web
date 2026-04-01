"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { getImageVariantUrl } from "@/lib/image-variants";

type MediaOption = {
  id: string;
  title: string;
  filePath: string;
  category?: string;
};

type MediaPathFieldProps = {
  name: string;
  label: string;
  value?: string | null;
  placeholder?: string;
  options?: MediaOption[];
  categories?: string[];
  emptyMessage?: string;
};

const INITIAL_VISIBLE_COUNT = 8;
const LOAD_MORE_COUNT = 8;

export function MediaPathField({
  name,
  label,
  value,
  options = [],
  categories,
  emptyMessage = "当前分类下还没有可选图片，请先去媒体库上传。"
}: MediaPathFieldProps) {
  const [selectedPath, setSelectedPath] = useState(value || "");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  useEffect(() => {
    setSelectedPath(value || "");
  }, [value]);

  const filteredOptions = useMemo(() => {
    const categoryMatched =
      !categories || categories.length === 0
        ? options
        : options.filter((option) => {
            const category = option.category || "shared";
            return categories.includes(category);
          });

    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return categoryMatched;
    }

    return categoryMatched.filter((option) => {
      return (
        option.title.toLowerCase().includes(normalizedKeyword) ||
        option.filePath.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [categories, keyword, options]);

  const selectedOption = useMemo(
    () => options.find((option) => option.filePath === selectedPath),
    [options, selectedPath]
  );

  const visibleOptions = filteredOptions.slice(0, visibleCount);
  const hasMore = filteredOptions.length > visibleCount;

  const handleOpenPicker = () => {
    setIsPickerOpen((prev) => !prev);
  };

  const handleClear = () => {
    setSelectedPath("");
  };

  const handleKeywordChange = (nextValue: string) => {
    setKeyword(nextValue);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  return (
    <div className="media-path-field">
      <input name={name} type="hidden" value={selectedPath} />

      <div className="media-field-head">
        <span>{label}</span>
        <div className="media-field-actions">
          <button className="button-ghost" type="button" onClick={handleOpenPicker}>
            {isPickerOpen ? "收起选图面板" : `打开选图面板 (${filteredOptions.length})`}
          </button>
          {selectedPath ? (
            <button className="button-ghost" type="button" onClick={handleClear}>
              清空图片
            </button>
          ) : null}
        </div>
      </div>

      <div className="media-inline-preview">
        {selectedPath ? (
          <div className="media-inline-card">
            <div className="media-inline-image">
              <Image src={getImageVariantUrl(selectedPath, "thumb")} alt={selectedOption?.title || label} fill sizes="120px" />
            </div>
            <div>
              <strong>{selectedOption?.title || "已选择图片"}</strong>
              <p className="muted">{selectedPath}</p>
            </div>
          </div>
        ) : (
          <div className="empty-state">当前还没有选择图片。</div>
        )}
      </div>

      {isPickerOpen ? (
        filteredOptions.length > 0 ? (
          <div className="media-picker-panel">
            <div className="media-picker-toolbar">
              <input
                className="media-picker-search"
                value={keyword}
                onChange={(event) => handleKeywordChange(event.target.value)}
                placeholder="搜索图片标题或路径"
              />
              <span className="muted">共 {filteredOptions.length} 张</span>
            </div>

            <div className="media-picker-scroll">
              <div className="media-picker-grid">
                {visibleOptions.map((option) => (
                  <button
                    key={option.id}
                    className={option.filePath === selectedPath ? "media-picker-item active" : "media-picker-item"}
                    type="button"
                    onClick={() => setSelectedPath(option.filePath)}
                  >
                    <div className="media-picker-thumb">
                      <Image src={getImageVariantUrl(option.filePath, "thumb")} alt={option.title} fill sizes="96px" />
                    </div>
                    <strong>{option.title}</strong>
                    <span>{option.filePath}</span>
                  </button>
                ))}
              </div>
            </div>

            {hasMore ? (
              <div className="media-picker-footer">
                <button
                  className="button-ghost"
                  type="button"
                  onClick={() => setVisibleCount((count) => count + LOAD_MORE_COUNT)}
                >
                  再显示 {Math.min(LOAD_MORE_COUNT, filteredOptions.length - visibleCount)} 张
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="empty-state">{emptyMessage}</div>
        )
      ) : null}
    </div>
  );
}
