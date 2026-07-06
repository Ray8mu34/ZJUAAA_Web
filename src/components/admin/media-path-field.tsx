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
const PICKER_PAGE_SIZE = 24;

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
  const [page, setPage] = useState(1);
  const [remoteOptions, setRemoteOptions] = useState<MediaOption[]>([]);
  const [totalCount, setTotalCount] = useState(options.length);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSelectedPath(value || "");
  }, [value]);

  const localFilteredOptions = useMemo(() => {
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

  useEffect(() => {
    if (!isPickerOpen) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PICKER_PAGE_SIZE)
    });

    if (keyword.trim()) {
      params.set("q", keyword.trim());
    }

    if (categories && categories.length > 0) {
      params.set("categories", categories.join(","));
    }

    setIsLoading(true);
    fetch(`/admin/api/media/search?${params.toString()}`, {
      signal: controller.signal
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("媒体搜索失败"))))
      .then((data: { items?: MediaOption[]; total?: number; totalPages?: number }) => {
        setRemoteOptions(data.items || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setRemoteOptions(localFilteredOptions.slice(0, PICKER_PAGE_SIZE));
          setTotalCount(localFilteredOptions.length);
          setTotalPages(Math.max(1, Math.ceil(localFilteredOptions.length / PICKER_PAGE_SIZE)));
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [categories, isPickerOpen, keyword, localFilteredOptions, page]);

  const selectedOption = useMemo(
    () => [...options, ...remoteOptions].find((option) => option.filePath === selectedPath),
    [options, remoteOptions, selectedPath]
  );

  const pickerOptions = isPickerOpen ? remoteOptions : localFilteredOptions.slice(0, INITIAL_VISIBLE_COUNT);

  const handleOpenPicker = () => {
    setIsPickerOpen((prev) => !prev);
  };

  const handleClear = () => {
    setSelectedPath("");
  };

  const handleKeywordChange = (nextValue: string) => {
    setKeyword(nextValue);
    setPage(1);
  };

  const handleSelect = (filePath: string) => {
    setSelectedPath(filePath);
    setIsPickerOpen(false);
  };

  return (
    <div className="media-path-field">
      <input name={name} type="hidden" value={selectedPath} />

      <div className="media-field-head">
        <span>{label}</span>
        <div className="media-field-actions">
          <button className="button-ghost" type="button" onClick={handleOpenPicker}>
            打开选图弹窗
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
        <div className="media-picker-modal" role="dialog" aria-modal="true" aria-label={`${label}选图`}>
          <div className="media-picker-backdrop" onClick={() => setIsPickerOpen(false)} />
          <div className="media-picker-panel">
            <div className="media-picker-toolbar">
              <input
                className="media-picker-search"
                value={keyword}
                onChange={(event) => handleKeywordChange(event.target.value)}
                placeholder="搜索图片标题或路径"
              />
              <span className="muted">{isLoading ? "搜索中..." : `共 ${totalCount} 张`}</span>
              <button className="button-ghost" type="button" onClick={() => setIsPickerOpen(false)}>
                关闭
              </button>
            </div>

            {pickerOptions.length > 0 ? (
              <div className="media-picker-scroll">
                <div className="media-picker-grid">
                  {pickerOptions.map((option) => (
                    <button
                      key={option.id}
                      className={option.filePath === selectedPath ? "media-picker-item active" : "media-picker-item"}
                      type="button"
                      onClick={() => handleSelect(option.filePath)}
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
            ) : (
              <div className="empty-state">{isLoading ? "正在搜索图片..." : emptyMessage}</div>
            )}

            {totalPages > 1 ? (
              <div className="media-picker-footer">
                <button
                  className="button-ghost"
                  disabled={page <= 1 || isLoading}
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  上一页
                </button>
                <span className="muted">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  className="button-ghost"
                  disabled={page >= totalPages || isLoading}
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                >
                  下一页
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
