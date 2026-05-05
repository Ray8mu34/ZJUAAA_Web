"use client";

import { useState } from "react";

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
};

export default function AdminManualImportPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // Load categories on mount
  if (!categoriesLoaded) {
    setCategoriesLoaded(true);
    fetch("/admin/api/import/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImporting(true);
    setResult(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/admin/api/import", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        form.reset();
      }
    } catch {
      setResult({ error: "上传失败，请重试。" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>批量导入手册内容</h2>
            <p className="muted">上传 ZIP 文件，一次性导入整个栏目的文章和图片。</p>
          </div>
          <a className="button-ghost" href="/admin/manual">
            返回文章管理
          </a>
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
            <li>文件夹名称将作为栏目名称（如果选择"自动创建栏目"）</li>
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
