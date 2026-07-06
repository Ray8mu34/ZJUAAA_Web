"use client";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="admin-error-panel">
      <section className="admin-card">
        <h2>操作没有完成</h2>
        <p className="form-error">{error.message || "后台操作失败，请检查输入后重试。"}</p>
        <button className="button-link" type="button" onClick={reset}>
          返回并重试
        </button>
      </section>
    </main>
  );
}
