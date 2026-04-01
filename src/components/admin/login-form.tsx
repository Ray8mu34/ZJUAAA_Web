"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";

export function AdminLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "");
    const password = String(formData.get("password") || "");

    startTransition(async () => {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false
      });

      if (result?.error) {
        setError("用户名或密码不正确，请检查后重试。");
        return;
      }

      window.location.href = callbackUrl || "/admin";
    });
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <label>
        <span>用户名</span>
        <input name="username" type="text" placeholder="admin" autoComplete="username" required />
      </label>
      <label>
        <span>密码</span>
        <input name="password" type="password" placeholder="请输入密码" autoComplete="current-password" required />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" disabled={isPending}>
        {isPending ? "登录中..." : "登录后台"}
      </button>
    </form>
  );
}
