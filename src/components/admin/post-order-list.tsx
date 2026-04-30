"use client";

import { ArrowDown, ArrowUp, GripVertical, LoaderCircle } from "lucide-react";
import { DragEvent, useEffect, useRef, useState, useTransition } from "react";

import { PostEditor } from "@/components/admin/post-editor";

type ServerAction = (formData: FormData) => Promise<void>;

type MediaOption = {
  id: string;
  title: string;
  filePath: string;
  category?: string;
};

type PostListItem = {
  id: string;
  slug: string;
  titleZh: string;
  summaryZh: string | null;
  author: string;
  coverImagePath: string | null;
  externalUrl: string | null;
  status: string;
  isFeatured: boolean;
};

type PostOrderListProps = {
  posts: PostListItem[];
  mediaOptions: MediaOption[];
  updateAction: ServerAction;
  statusAction: ServerAction;
  deleteAction: ServerAction;
  reorderAction: ServerAction;
};

function reorderItems(items: PostListItem[], sourceId: string, targetId: string) {
  if (sourceId === targetId) {
    return items;
  }

  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, movedItem);
  return nextItems;
}

function orderSignature(items: PostListItem[]) {
  return items.map((item) => item.id).join("|");
}

export function PostOrderList({
  posts,
  mediaOptions,
  updateAction,
  statusAction,
  deleteAction,
  reorderAction
}: PostOrderListProps) {
  const [items, setItems] = useState(posts);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const itemsRef = useRef(items);
  const dragStartSignatureRef = useRef(orderSignature(posts));
  const persistedDragRef = useRef(false);

  useEffect(() => {
    setItems(posts);
    itemsRef.current = posts;
    dragStartSignatureRef.current = orderSignature(posts);
  }, [posts]);

  function persistOrder(nextItems: PostListItem[]) {
    const formData = new FormData();
    formData.set("ids", JSON.stringify(nextItems.map((item) => item.id)));

    startTransition(() => {
      void reorderAction(formData);
    });
  }

  function persistIfChanged(nextItems: PostListItem[]) {
    if (orderSignature(nextItems) === dragStartSignatureRef.current) {
      return;
    }

    persistedDragRef.current = true;
    persistOrder(nextItems);
  }

  function moveByButton(id: string, direction: -1 | 1) {
    const currentIndex = itemsRef.current.findIndex((item) => item.id === id);
    const target = itemsRef.current[currentIndex + direction];

    if (!target) {
      return;
    }

    const nextItems = reorderItems(itemsRef.current, id, target.id);
    itemsRef.current = nextItems;
    setItems(nextItems);
    dragStartSignatureRef.current = orderSignature(itemsRef.current);
    persistOrder(nextItems);
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, id: string) {
    setDraggingId(id);
    dragStartSignatureRef.current = orderSignature(itemsRef.current);
    persistedDragRef.current = false;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, targetId: string) {
    if (!draggingId) {
      return;
    }

    event.preventDefault();

    setItems((currentItems) => {
      const nextItems = reorderItems(currentItems, draggingId, targetId);
      itemsRef.current = nextItems;
      return nextItems;
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, targetId: string) {
    event.preventDefault();
    const sourceId = draggingId || event.dataTransfer.getData("text/plain");

    if (!sourceId) {
      return;
    }

    const nextItems = reorderItems(itemsRef.current, sourceId, targetId);
    itemsRef.current = nextItems;
    setItems(nextItems);
    persistIfChanged(nextItems);
    setDraggingId(null);
  }

  function handleDragEnd() {
    if (draggingId && !persistedDragRef.current) {
      persistIfChanged(itemsRef.current);
    }

    setDraggingId(null);
  }

  return (
    <div className="admin-stack">
      <div className="post-sort-head">
        <p className="muted">排序越靠前，首页和知识科普页越优先显示；新建文章会自动排到最前面。</p>
        {isPending ? (
          <span className="post-sort-saving">
            <LoaderCircle aria-hidden="true" size={16} />
            保存中
          </span>
        ) : null}
      </div>

      {items.map((post, index) => (
        <div
          className={post.id === draggingId ? "post-sort-row is-dragging" : "post-sort-row"}
          key={post.id}
          onDragOver={(event) => handleDragOver(event, post.id)}
          onDrop={(event) => handleDrop(event, post.id)}
        >
          <div className="post-sort-controls" aria-label={`${post.titleZh} 排序操作`}>
            <button
              aria-label={`拖动排序：${post.titleZh}`}
              className="icon-button post-drag-handle"
              draggable
              title="拖动排序"
              type="button"
              onDragEnd={handleDragEnd}
              onDragStart={(event) => handleDragStart(event, post.id)}
            >
              <GripVertical aria-hidden="true" size={18} />
            </button>
            <button
              aria-label={`上移：${post.titleZh}`}
              className="icon-button"
              disabled={index === 0 || isPending}
              title="上移"
              type="button"
              onClick={() => moveByButton(post.id, -1)}
            >
              <ArrowUp aria-hidden="true" size={16} />
            </button>
            <button
              aria-label={`下移：${post.titleZh}`}
              className="icon-button"
              disabled={index === items.length - 1 || isPending}
              title="下移"
              type="button"
              onClick={() => moveByButton(post.id, 1)}
            >
              <ArrowDown aria-hidden="true" size={16} />
            </button>
          </div>

          <details className="post-item post-item-collapsible">
            <summary className="post-item-summary">
              <div>
                <strong>{post.titleZh}</strong>
                <div className="post-meta">
                  <span>slug: {post.slug}</span>
                  <span>作者：{post.author}</span>
                  <span>状态：{post.status}</span>
                  {post.isFeatured ? <span>首页精选</span> : null}
                </div>
              </div>
            </summary>

            <div className="post-item-body">
              <PostEditor
                action={updateAction}
                submitLabel="保存修改"
                mediaOptions={mediaOptions}
                initialValues={{
                  id: post.id,
                  slug: post.slug,
                  titleZh: post.titleZh,
                  summaryZh: post.summaryZh,
                  author: post.author,
                  coverImagePath: post.coverImagePath,
                  externalUrl: post.externalUrl,
                  isFeatured: post.isFeatured
                }}
              />

              <div className="post-actions">
                <form action={statusAction}>
                  <input type="hidden" name="id" value={post.id} />
                  <input type="hidden" name="status" value="PUBLISHED" />
                  <button className="button-ghost" type="submit">
                    发布
                  </button>
                </form>
                <form action={statusAction}>
                  <input type="hidden" name="id" value={post.id} />
                  <input type="hidden" name="status" value="DRAFT" />
                  <button className="button-ghost" type="submit">
                    转为草稿
                  </button>
                </form>
                <a className="button-ghost" href={post.externalUrl || "#"} target="_blank" rel="noreferrer">
                  查看外链
                </a>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={post.id} />
                  <button className="button-ghost danger-text" type="submit">
                    删除
                  </button>
                </form>
              </div>
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
