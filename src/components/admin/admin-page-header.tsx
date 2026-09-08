import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  primaryHref?: string;
  primaryLabel?: string;
  children?: React.ReactNode;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  primaryHref,
  primaryLabel = "新建",
  children
}: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-heading">
        {backHref ? (
          <Link className="admin-back-link" href={backHref}>
            <ArrowLeft size={15} /> 返回列表
          </Link>
        ) : null}
        {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="admin-page-actions">
        {children}
        {primaryHref ? (
          <Link className="admin-primary-action" href={primaryHref}>
            <Plus size={16} /> {primaryLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}

export function AdminStatus({ status }: { status: string }) {
  const label = status === "PUBLISHED" ? "已发布" : status === "ARCHIVED" ? "已归档" : "草稿";
  return <span className={`admin-status admin-status-${status.toLowerCase()}`}>{label}</span>;
}
