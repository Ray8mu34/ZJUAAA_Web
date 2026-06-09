import Link from "next/link";
import { Download, Images } from "lucide-react";

import { requireAdminSession } from "@/lib/admin-session";

export default async function AdminInternalPage() {
  await requireAdminSession();

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h2>内部资料</h2>
        <p className="muted">维护只面向成员开放的资料下载和宣传部作品展示内容。</p>
        <div className="admin-quick-grid">
          <Link className="admin-quick-card" href="/admin/internal/files">
            <Download size={22} />
            <strong>文件下载</strong>
            <span>上传望远镜操作视频、图文资料、表格等内部文件。</span>
          </Link>
          <Link className="admin-quick-card" href="/admin/internal/publicity">
            <Images size={22} />
            <strong>宣传部作品</strong>
            <span>维护海报、传单、纳新视觉和对应说明。</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
