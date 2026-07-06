"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AdminActionFormProps = {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  successMessage?: string;
  pendingMessage?: string;
  confirmMessage?: string;
  resetOnSuccess?: boolean;
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
  resetOnSuccess = false
}: AdminActionFormProps) {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState>(null);
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
    <form className={className} onSubmit={handleSubmit} aria-busy={isPending}>
      {children}
      {isPending ? <p className="muted">{pendingMessage}</p> : null}
      {toast ? (
        <div className={`admin-toast ${toast.status}`} role="status">
          {toast.message}
        </div>
      ) : null}
    </form>
  );
}
