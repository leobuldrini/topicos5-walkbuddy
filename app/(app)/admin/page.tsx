import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPage() {
  const admin = createAdminClient();
  const [users, walks, reports] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("walk_requests").select("id", { count: "exact", head: true }),
    admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "aberta"),
  ]);

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-zinc-200 p-4">
        <dt className="text-sm text-zinc-600">Usuários</dt>
        <dd className="text-2xl font-semibold text-zinc-900">{users.count ?? 0}</dd>
      </div>
      <div className="rounded-lg border border-zinc-200 p-4">
        <dt className="text-sm text-zinc-600">Passeios</dt>
        <dd className="text-2xl font-semibold text-zinc-900">{walks.count ?? 0}</dd>
      </div>
      <div className="rounded-lg border border-zinc-200 p-4">
        <dt className="text-sm text-zinc-600">Denúncias abertas</dt>
        <dd className="text-2xl font-semibold text-zinc-900">{reports.count ?? 0}</dd>
      </div>
    </dl>
  );
}
