import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { summarizeEarnings } from "@/lib/walks/earnings";

export default async function WalkerEarningsPage() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data: walks } = await sb
    .from("walk_requests")
    .select("status, price_estimate")
    .eq("walker_id", user.id)
    .order("created_at", { ascending: false });
  const summary = summarizeEarnings(walks ?? []);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Ganhos</h1>
        <p className="text-sm text-zinc-600">Resumo de passeios concluídos.</p>
      </div>
      <dl className="grid max-w-md gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4">
          <dt className="text-sm text-zinc-600">Passeios concluídos</dt>
          <dd className="text-2xl font-semibold text-zinc-900">{summary.completed}</dd>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <dt className="text-sm text-zinc-600">Total estimado</dt>
          <dd className="text-2xl font-semibold text-zinc-900">R$ {summary.total.toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  );
}
