import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getProfile, hasRole } from "@/lib/profile";
import { createServerClient } from "@/lib/supabase/server";

const statusLabel: Record<string, string> = {
  solicitado: "Solicitado",
  aceito: "Aceito",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default async function WalksPage() {
  const user = await requireUser();
  const profile = await getProfile();
  const sb = await createServerClient();

  let query = sb
    .from("walk_requests")
    .select("id, scheduled_date, start_time, status, price_estimate, region, pet:pets(name), walker:walker_profiles(profiles(display_name))")
    .order("created_at", { ascending: false });

  if (hasRole(profile, "walker") && !hasRole(profile, "tutor")) {
    query = query.eq("walker_id", user.id);
  } else {
    query = query.eq("tutor_id", user.id);
  }

  const { data: walks } = await query;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">Passeios</h1>
        {hasRole(profile, "tutor") && (
          <Link href="/walks/new" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
            Novo passeio
          </Link>
        )}
      </div>

      {!walks || walks.length === 0 ? (
        <p className="text-sm text-zinc-600">Nenhum passeio encontrado.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {walks.map((walk) => (
            <li key={walk.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4">
              <div>
                <p className="font-medium text-zinc-900">
                  {Array.isArray(walk.pet) ? walk.pet[0]?.name : walk.pet?.name} · {statusLabel[walk.status] ?? walk.status}
                </p>
                <p className="text-sm text-zinc-600">
                  {walk.region} · {walk.scheduled_date} às {walk.start_time.slice(0, 5)} · R${" "}
                  {Number(walk.price_estimate).toFixed(2)}
                </p>
              </div>
              <Link href={`/walks/${walk.id}`} className="text-sm font-medium text-zinc-700 underline">
                Ver detalhes
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
