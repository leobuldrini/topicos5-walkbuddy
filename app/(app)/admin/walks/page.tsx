import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminWalksPage() {
  const { data: walks } = await createAdminClient()
    .from("walk_requests")
    .select("id, status, region, scheduled_date, price_estimate")
    .order("created_at", { ascending: false });

  return (
    <ul className="flex flex-col gap-2">
      {(walks ?? []).map((walk) => (
        <li key={walk.id} className="rounded-lg border border-zinc-200 p-4 text-sm">
          <p className="font-medium text-zinc-900">{walk.status} · {walk.region}</p>
          <p className="text-zinc-600">{walk.scheduled_date} · R$ {Number(walk.price_estimate).toFixed(2)}</p>
        </li>
      ))}
    </ul>
  );
}
