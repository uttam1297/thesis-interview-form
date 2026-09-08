import type { Metadata } from "next";

import { SessionsBrowser } from "@/app/admin/(protected)/sessions-browser";
import { listSessions, summarise } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Sessions" };

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const sessions = await listSessions();
  const stats = summarise(sessions);

  const tiles = [
    { label: "Sessions", value: stats.total },
    { label: "Completed", value: stats.completed },
    { label: "In progress", value: stats.inProgress },
    { label: "Inactive", value: stats.inactive },
    { label: "Form", value: stats.byMode.asynchronous_form },
    { label: "Live", value: stats.byMode.live_interview },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Overview">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-lg border p-4">
              <dt className="text-xs text-muted-foreground">{tile.label}</dt>
              <dd className="text-2xl font-medium tabular-nums">
                {tile.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <SessionsBrowser sessions={sessions} />
    </div>
  );
}
