"use client";

import Image from "next/image";
import { useState } from "react";

import { deleteMediaAsset } from "@/app/admin/media/actions";
import { AdminActionForm } from "@/components/admin/admin-action-form";
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
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const visibleAssets = assets.slice(0, visibleCount);
  const hasMore = assets.length > visibleCount;

  return (
    <div className="admin-stack">
      <div className="media-grid">
        {visibleAssets.map((asset) => (
          <article className="media-card" key={asset.id}>
            <div className="media-preview">
              <Image src={getImageVariantUrl(asset.filePath, "thumb")} alt={asset.title} fill sizes="240px" loading="lazy" unoptimized />
            </div>
            <strong>{asset.title}</strong>
            <p className="tag">{categoryLabels[asset.category] || asset.category}</p>
            <p className="muted">{asset.filePath}</p>
            <p className="muted">{asset.mimeType}</p>
            <AdminActionForm
              action={deleteMediaAsset}
              className=""
              successMessage="图片记录已删除。"
              confirmMessage={`确认删除图片「${asset.title}」？如果图片仍被引用，系统会阻止删除。`}
            >
              <input type="hidden" name="id" value={asset.id} />
              <button className="button-ghost danger-text" type="submit">
                删除图片
              </button>
            </AdminActionForm>
          </article>
        ))}
      </div>

      {hasMore ? (
        <div className="media-picker-footer">
          <button className="button-ghost" type="button" onClick={() => setVisibleCount((count) => count + LOAD_STEP)}>
            再显示 {Math.min(LOAD_STEP, assets.length - visibleCount)} 张
          </button>
        </div>
      ) : null}
    </div>
  );
}
