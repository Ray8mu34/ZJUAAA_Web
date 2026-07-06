"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

type MediaUploadState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialState: MediaUploadState = {
  status: "idle",
  message: ""
};

export function MediaUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<MediaUploadState>(initialState);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const request = new XMLHttpRequest();

    setIsUploading(true);
    setProgress(0);
    setState(initialState);

    request.upload.onprogress = (progressEvent) => {
      if (!progressEvent.lengthComputable) return;
      setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
    };

    request.onload = () => {
      setIsUploading(false);
      setProgress(request.status >= 200 && request.status < 300 ? 100 : 0);

      let payload: { message?: string; error?: string } = {};
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        payload = {};
      }

      if (request.status >= 200 && request.status < 300) {
        setState({
          status: "success",
          message: payload.message || "上传完成。"
        });
        formRef.current?.reset();
        router.refresh();
        return;
      }

      setState({
        status: "error",
        message: payload.error || "上传失败，请稍后重试。"
      });
    };

    request.onerror = () => {
      setIsUploading(false);
      setProgress(0);
      setState({
        status: "error",
        message: "网络连接中断，上传失败。"
      });
    };

    request.open("POST", "/admin/api/media");
    request.send(formData);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-grid">
        <label>
          <span>图片标题</span>
          <input name="title" type="text" placeholder="例如：社团合照、活动海报、月球特写" />
        </label>
        <label>
          <span>图片文件</span>
          <input className="file-input" name="files" type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple required />
        </label>
      </div>

      <div className="admin-form-grid">
        <label>
          <span>用途分类</span>
          <select className="admin-select" name="category" defaultValue="shared">
            <option value="shared">通用</option>
            <option value="site">首页 / 页脚</option>
            <option value="knowledge">知识科普</option>
            <option value="manual">天文手册</option>
            <option value="activity">社团活动</option>
            <option value="gallery">天文摄影</option>
            <option value="internal">内部资料</option>
            <option value="publicity">宣传部作品</option>
          </select>
        </label>
        <label>
          <span>中文替代标题</span>
          <input name="altZh" type="text" placeholder="用于无障碍和图片说明，可不填" />
        </label>
      </div>

      {state.status !== "idle" ? (
        <div className={`admin-toast ${state.status === "error" ? "error" : "success"}`} role="status">
          {state.message}
        </div>
      ) : null}

      {isUploading ? (
        <div className="admin-upload-progress" aria-label={`上传进度 ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
          <strong>{progress}%</strong>
        </div>
      ) : null}

      <button className="button-link" type="submit" disabled={isUploading}>
        {isUploading ? "正在上传..." : "上传图片"}
      </button>
    </form>
  );
}
