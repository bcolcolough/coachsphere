"use client";

import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";

export function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const devAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === "true";

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => signIn("okta", { callbackUrl: "/" })}
        className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-100"
      >
        Continue with Okta
      </button>
      {devAuthEnabled ? (
        <form
          className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            setError(null);
            startTransition(async () => {
              const result = await signIn("dev", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirect: false,
                callbackUrl: "/",
              });
              if (result?.error) {
                setError("Those development credentials did not match.");
                return;
              }
              window.location.href = result?.url ?? "/";
            });
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-200">
            Local dev sign in
          </div>
          <label className="block text-sm text-slate-200">
            Email
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none ring-violet-400 focus:ring-2"
              type="email"
              name="email"
              defaultValue="admin@anysphere.co"
              required
            />
          </label>
          <label className="block text-sm text-slate-200">
            Password
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none ring-violet-400 focus:ring-2"
              type="password"
              name="password"
              defaultValue="password"
              required
            />
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Signing in…" : "Use dev credentials"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
