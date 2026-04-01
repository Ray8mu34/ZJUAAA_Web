"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { deleteMediaAsset } from "@/app/admin/media/actions";
import { getImageVariantUrl } from "@/lib/image-variants";

type MediaAssetItem = {
  id: string;
  title: string;
  filePath: string;
  mimeType: string;
  category: string;
};

const INITIAL_VISIBLE = 12;
const LOAD_STEP = 12;

export function AdminMediaGrid({
  assets,
  categoryLabels
}: {
  assets: MediaAssetItem[];
  categoryLabels: Record<string, string>;
}) {
  const [keyword, setKeyword] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const filteredAssets = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return assets;

    return assets.filter((asset) => {
      return (
        asset.title.toLowerCase().includes(normalized) ||
        asset.filePath.toLowerCase().includes(normalized) ||
        (categoryLabels[asset.category] || asset.category).toLowerCase().includes(normalized)
      );
    });
  }, [assets, categoryLabels, keyword]);

  const visibleAssets = filteredAssets.slice(0, visibleCount);
  const hasMore = filteredAssets.length > visibleCount;

  return (
    <div className="admin-stack">
      <div className="media-library-toolbar">
        <input
          className="media-picker-search"
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setVisibleCount(INITIAL_VISIBLE);
          }}
          placeholder="搜索标题、分类或文件路径"
        />
        <span className="muted">共 {filteredAssets.length} 张图片</span>
      </div>

      <div className="media-grid">
        {visibleAssets.map((asset) => (
          <article className="media-card" key={asset.id}>
            <div className="media-preview">
              <Image src={getImageVariantUrl(asset.filePath, "thumb")} alt={asset.title} fill sizes="240px" />
            </div>
            <strong>{asset.title}</strong>
            <p className="tag">{categoryLabels[asset.category] || asset.category}</p>
            <p className="muted">{asset.filePath}</p>
            <p className="muted">{asset.mimeType}</p>
            <form action={deleteMediaAsset}>
              <input type="hidden" name="id" value={asset.id} />
              <button className="button-ghost danger-text" type="submit">
                删除图片
              </button>
            </form>
          </article>
        ))}
      </div>

      {hasMore ? (
        <div className="media-picker-footer">
          <button className="button-ghost" type="button" onClick={() => setVisibleCount((count) => count + LOAD_STEP)}>
            再显示 {Math.min(LOAD_STEP, filteredAssets.length - visibleCount)} 张
          </button>
        </div>
      ) : null}
    </div>
  );
}
