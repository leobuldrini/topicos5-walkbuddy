import { acceptWalk, completeWalk, rejectWalk, startWalk } from "@/app/(app)/actions/walks";
import { ActionFormButton } from "@/components/ActionFormButton";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { isAvailableAt } from "@/lib/walks/matching";

export default async function WalkerRequestsPage() {
  const user = await requireUser();
  const sb = await createServerClient();
  const [{ data: profile }, { data: availability }, { data: requests }, { data: accepted }] = await Promise.all([
    sb.from("walker_profiles").select("service_region").eq("id", user.id).single(),
    sb.from("availability").select("weekday, start_time, end_time").eq("walker_id", user.id),
    sb
      .from("walk_requests")
      .select("id, region, scheduled_date, start_time, duration_min, price_estimate, pet:pets(name, size)")
      .eq("status", "solicitado")
      .is("walker_id", null),
    sb
      .from("walk_requests")
      .select("id, status, region, scheduled_date, start_time, duration_min, price_estimate, pet:pets(name, size)")
      .eq("walker_id", user.id)
      .in("status", ["aceito", "em_andamento"]),
  ]);

  const open = (requests ?? []).filter((request) => {
    const weekday = new Date(`${request.scheduled_date}T00:00:00`).getDay();
    return (
      (profile?.service_region ?? "").toLowerCase() === request.region.toLowerCase() &&
      isAvailableAt(availability ?? [], weekday, request.start_time)
    );
  });

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Solicitações recebidas</h1>
        <p className="text-sm text-zinc-600">Aceite pedidos compatíveis com sua região e disponibilidade.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900">Abertas</h2>
        {open.length === 0 ? (
          <p className="text-sm text-zinc-600">Nenhuma solicitação compatível no momento.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {open.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4">
                <p className="text-sm text-zinc-700">
                  {Array.isArray(request.pet) ? request.pet[0]?.name : request.pet?.name} · {request.region} ·{" "}
                  {request.scheduled_date} às {request.start_time.slice(0, 5)}
                </p>
                <div className="flex gap-2">
                  <ActionFormButton action={acceptWalk.bind(null, request.id)} label="Aceitar" />
                  <ActionFormButton action={rejectWalk.bind(null, request.id)} label="Recusar" variant="secondary" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900">Em andamento</h2>
        {!accepted || accepted.length === 0 ? (
          <p className="text-sm text-zinc-600">Nenhum passeio aceito.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {accepted.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4">
                <p className="text-sm text-zinc-700">
                  {Array.isArray(request.pet) ? request.pet[0]?.name : request.pet?.name} · {request.status} ·{" "}
                  {request.scheduled_date} às {request.start_time.slice(0, 5)}
                </p>
                {request.status === "aceito" ? (
                  <ActionFormButton action={startWalk.bind(null, request.id)} label="Iniciar" />
                ) : (
                  <ActionFormButton action={completeWalk.bind(null, request.id)} label="Concluir" />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
