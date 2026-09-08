import Link from "next/link";

import { SignOutButton } from "@/app/admin/(protected)/sign-out-button";
import { requireResearcher } from "@/features/admin/auth";

/**
 * Server-side gate for the whole admin area. Every nested page is rendered
 * only after researcher membership is verified here; proxy.ts merely avoids
 * a wasted render.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const researcher = await requireResearcher();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="text-sm font-medium">
            Research dashboard
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground">
              Sessions
            </Link>
            <Link href="/admin/constructs" className="hover:text-foreground">
              By construct
            </Link>
            <Link href="/admin/live/new" className="hover:text-foreground">
              Live interview
            </Link>
            <Link href="/admin/pilot" className="hover:text-foreground">
              Pilot
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {researcher.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
