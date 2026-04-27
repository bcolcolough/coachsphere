import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isDevAuthEnabled } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/");
  }

  const devAuthEnabled = isDevAuthEnabled();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.28),_transparent_35%),#020617] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-200">
            CoachSphere
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Sign in to the private channel</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Access is restricted to authenticated Anysphere teammates via Okta. Local development
            can use the explicit dev-auth provider when enabled.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/api/auth/signin/okta"
              className="rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-violet-100"
            >
              Continue with Okta
            </Link>
            {devAuthEnabled ? (
              <Link
                href="/api/auth/signin/dev"
                className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10"
              >
                Use local dev sign-in
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
