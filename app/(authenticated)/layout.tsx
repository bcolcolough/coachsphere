import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminCandidate } from "@/lib/admin";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = isAdminCandidate(session.user);

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07070a]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500 text-lg font-black">
              C
            </span>
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.24em] text-violet-200">
                CoachSphere
              </span>
              <span className="hidden text-xs text-zinc-400 sm:block">
                Internal GTM channel
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {isAdmin ? (
              <Link
                href="/admin"
                className="rounded-full border border-violet-400/40 bg-violet-400/10 px-3 py-2 font-semibold text-violet-100"
              >
                Admin
              </Link>
            ) : null}
            <span className="hidden max-w-[180px] truncate text-zinc-300 md:inline">
              {session.user.name ?? session.user.email}
            </span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
