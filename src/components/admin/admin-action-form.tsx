"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AdminActionFormProps = {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  successMessage?: string;
  pendingMessage?: string;
  confirmMessage?: string;
  resetOnSuccess?: boolean;
  trackChanges?: boolean;
};

type ToastState = {
  status: "success" | "error";
  message: string;
} | null;

export function AdminActionForm({
  action,
  children,
  className = "admin-form",
  successMessage = "操作已完成。",
  pendingMessage = "正在保存...",
  confirmMessage,
  resetOnSuccess = false,
  trackChanges = className === "admin-form"
}: AdminActionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setToast(null);

    startTransition(() => {
      void (async () => {
        try {
          await action(formData);
          setToast({ status: "success", message: successMessage });
          if (resetOnSuccess) {
            form.reset();
          }
          setIsDirty(false);
          router.refresh();
        } catch (error) {
          setToast({
            status: "error",
            message: error instanceof Error ? error.message : "操作失败，请稍后重试。"
          });
        }
      })();
    });
  }

  return (
    <form ref={formRef} className={className} onSubmit={handleSubmit} onChange={() => trackChanges && setIsDirty(true)} aria-busy={isPending}>
      {children}
      {isPending ? <p className="muted">{pendingMessage}</p> : null}
      {toast ? (
        <div className={`admin-toast ${toast.status}`} role="status">
          {toast.message}
        </div>
      ) : null}
      {trackChanges && isDirty ? (
        <div className="admin-save-bar" role="status">
          <span><i /> 未保存更改</span>
          <div>
            <button className="admin-text-action" type="button" onClick={() => { formRef.current?.reset(); setIsDirty(false); }}>取消</button>
            <button className="button-link" type="submit" disabled={isPending}>{isPending ? pendingMessage : "保存更改"}</button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
