export default function AdminMediaLoading() {
  return <div className="admin-stack" aria-label="正在加载媒体库" aria-busy="true">
    <header className="admin-page-header admin-loading-header">
      <div><span className="admin-loading-line admin-loading-title" /><span className="admin-loading-line admin-loading-copy" /></div>
    </header>
    <section className="admin-card">
      <div className="admin-loading-toolbar"><span className="admin-loading-line" /><span className="admin-loading-line" /></div>
      <div className="media-grid admin-loading-media-grid">
        {Array.from({ length: 8 }, (_, index) => <div className="media-card" key={index}><span className="media-preview admin-loading-block" /><span className="admin-loading-line" /><span className="admin-loading-line admin-loading-copy" /></div>)}
      </div>
    </section>
  </div>;
}
