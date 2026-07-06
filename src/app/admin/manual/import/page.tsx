"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CategoryOption = {
  id: string;
  slug: string;
  titleZh: string;
};

type ImportResult = {
  success?: boolean;
  message?: string;
  error?: string;
  results?: Array<{ title: string; slug: string }>;
  importedImages?: Array<{ originalPath: string; filePath: string }>;
  skippedFiles?: Array<{ fileName: string; reason: string }>;
};

export default function AdminManualImportPage() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    fetch("/admin/api/import/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImporting(true);
    setProgress(0);
    setResult(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const request = new XMLHttpRequest();

    request.upload.onprogress = (progressEvent) => {
      if (!progressEvent.lengthComputable) return;
      setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
    };

    request.onload = () => {
      setImporting(false);
      setProgress(request.status >= 200 && request.status < 300 ? 100 : 0);

      let data: ImportResult = {};
      try {
        data = JSON.parse(request.responseText);
      } catch {
        data = { error: "导入失败，请检查服务器响应。" };
      }

      setResult(data);

      if (data.success) {
        form.reset();
      }
    };

    request.onerror = () => {
      setImporting(false);
      setProgress(0);
      setResult({ error: "上传失败，请重试。" });
    };

    request.open("POST", "/admin/api/import");
    request.send(formData);
  }

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>批量导入手册内容</h2>
            <p className="muted">上传 ZIP 文件，一次性导入整个栏目的文章和图片。</p>
          </div>
          <Link className="button-ghost" href="/admin/manual">
            返回文章管理
          </Link>
        </div>

        <div className="admin-import-info">
          <h3>ZIP 文件结构说明</h3>
          <p>ZIP 内应包含一个栏目文件夹，文件夹内是 Markdown 文件和图片：</p>
          <pre className="admin-code-block">{`栏目名称/
├── 01-文章标题.md
├── 02-另一篇文章.md
└── images/
    ├── 图片1.jpg
    └── 图片2.png`}</pre>
          <ul>
            <li>文件夹名称将作为栏目名称（如果选择“自动创建栏目”）</li>
            <li>Markdown 文件名前的数字将作为排序依据（如 01、02）</li>
            <li>支持在 Markdown 文件头部使用 YAML frontmatter 设置标题、作者等信息</li>
            <li>图片路径请使用相对路径，如 <code>![描述](images/图片1.jpg)</code></li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <label>
            <span>选择 ZIP 文件</span>
            <input name="file" type="file" accept=".zip" required />
          </label>

          <label>
            <span>目标栏目（可选）</span>
            <select name="categoryId" defaultValue="">
              <option value="">自动从文件夹名称创建栏目</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.titleZh}
                </option>
              ))}
            </select>
            <small className="muted">如果不选择，将根据 ZIP 内的文件夹名称自动创建或匹配栏目。</small>
          </label>

          <button className="button-link" type="submit" disabled={importing}>
            {importing ? "正在导入..." : "开始导入"}
          </button>
        </form>

        {importing ? (
          <div className="admin-upload-progress" aria-label={`导入上传进度 ${progress}%`}>
            <span style={{ width: `${progress}%` }} />
            <strong>{progress}%</strong>
          </div>
        ) : null}

        {result && (
          <div className={`admin-import-result ${result.success ? "success" : "error"}`}>
            {result.success ? (
              <>
                <p>{result.message}</p>
                {result.results && result.results.length > 0 && (
                  <ul>
                    {result.results.map((item, i) => (
                      <li key={i}>
                        {item.title} <span className="muted">({item.slug})</span>
                      </li>
                    ))}
                  </ul>
                )}
                {result.importedImages && result.importedImages.length > 0 ? (
                  <>
                    <p className="muted">导入图片：</p>
                    <ul>
                      {result.importedImages.map((item) => (
                        <li key={item.filePath}>
                          {item.originalPath} <span className="muted">→ {item.filePath}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {result.skippedFiles && result.skippedFiles.length > 0 ? (
                  <>
                    <p className="form-error">跳过文件：</p>
                    <ul>
                      {result.skippedFiles.map((item) => (
                        <li key={item.fileName}>
                          {item.fileName} <span className="muted">({item.reason})</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <p className="muted">文章已导入为草稿状态，请在文章管理中发布。</p>
              </>
            ) : (
              <p>{result.error}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
