import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { cancelWalk, chooseWalker } from "@/app/(app)/actions/walks";
import { ActionFormButton } from "@/components/ActionFormButton";
import { CancelForm } from "@/components/CancelForm";
import { ReportForm } from "@/components/ReportForm";
import { ReviewForm } from "@/components/ReviewForm";
import { markChosen, recommendForRequest } from "@/lib/recommender";

const statusLabel: Record<string, string> = {
  solicitado: "Solicitado",
  aceito: "Aceito",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default async function WalkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const sb = await createServerClient();
  const { data: walk } = await sb
    .from("walk_requests")
    .select("id, tutor_id, walker_id, region, scheduled_date, start_time, duration_min, location_text, status, price_estimate, cancel_reason, pet:pets(id, name, size), walker:walker_profiles(id, profiles(display_name)), payment:payments(status)")
    .eq("id", id)
    .single();

  if (!walk) notFound();
  const walkId = walk.id;

  const recommendations = !walk.walker_id && walk.status === "solicitado" ? await recommendForRequest(walk.id) : [];
  const { data: recommendedWalkers } =
    recommendations.length > 0
      ? await sb
          .from("walker_profiles")
          .select("id, service_region, base_price, profiles(display_name)")
          .in(
            "id",
            recommendations.map((item) => item.walkerId),
          )
      : { data: [] };
  const walkerById = new Map((recommendedWalkers ?? []).map((walker) => [walker.id, walker]));

  const boundCancel = cancelWalk.bind(null, walk.id);
  const pet = Array.isArray(walk.pet) ? walk.pet[0] : walk.pet;
  const counterpartId = walk.tutor_id === user.id ? walk.walker_id : walk.tutor_id;

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Detalhes do passeio</h1>
        <p className="text-sm text-zinc-600">{statusLabel[walk.status] ?? walk.status}</p>
      </div>

      <section className="grid gap-3 text-sm text-zinc-700 md:grid-cols-2">
        <p><span className="font-medium text-zinc-900">Pet:</span> {pet?.name}</p>
        <p><span className="font-medium text-zinc-900">Região:</span> {walk.region}</p>
        <p><span className="font-medium text-zinc-900">Data:</span> {walk.scheduled_date}</p>
        <p><span className="font-medium text-zinc-900">Horário:</span> {walk.start_time.slice(0, 5)}</p>
        <p><span className="font-medium text-zinc-900">Duração:</span> {walk.duration_min} min</p>
        <p><span className="font-medium text-zinc-900">Preço:</span> R$ {Number(walk.price_estimate).toFixed(2)}</p>
        <p><span className="font-medium text-zinc-900">Pagamento:</span> {Array.isArray(walk.payment) ? walk.payment[0]?.status ?? "pendente" : walk.payment?.status ?? "pendente"}</p>
        {walk.location_text && <p><span className="font-medium text-zinc-900">Local:</span> {walk.location_text}</p>}
        {walk.cancel_reason && <p><span className="font-medium text-zinc-900">Cancelamento:</span> {walk.cancel_reason}</p>}
      </section>

      {!walk.walker_id && walk.status === "solicitado" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-zinc-900">Escolher passeador</h2>
          {recommendations.length === 0 ? (
            <p className="text-sm text-zinc-600">Nenhum passeador encontrado para esta região.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recommendations.map((recommendation, index) => {
                const walker = walkerById.get(recommendation.walkerId);
                async function chooseRecommended() {
                  "use server";
                  const result = await chooseWalker(walkId, recommendation.walkerId);
                  if (result?.ok) await markChosen(walkId, recommendation.walkerId);
                }
                return (
                  <li key={recommendation.walkerId} className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-zinc-200 p-3">
                    <div className="text-sm text-zinc-700">
                      <p className="font-medium text-zinc-900">
                        #{index + 1} {walker?.profiles?.display_name ?? "Passeador"} · pontuação {recommendation.score.toFixed(2)}
                      </p>
                      <p>
                        {walker?.service_region ?? walk.region} · R$ {Number(walker?.base_price ?? 0).toFixed(2)}
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600">
                        {recommendation.reasons.map((reason) => (
                          <li key={reason.criterion} className="rounded-md bg-zinc-100 px-2 py-1">
                            {reason.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <ActionFormButton action={chooseRecommended} label="Escolher" />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {(walk.status === "solicitado" || walk.status === "aceito") && (walk.tutor_id === user.id || walk.walker_id === user.id) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-zinc-900">Cancelar</h2>
          <CancelForm action={boundCancel} />
        </section>
      )}

      {walk.status === "concluido" && counterpartId && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-zinc-900">Avaliação</h2>
          {walk.tutor_id === user.id && walk.walker_id && (
            <ReviewForm walkRequestId={walk.id} targetType="walker" targetId={walk.walker_id} />
          )}
          {walk.walker_id === user.id && (
            <>
              <ReviewForm walkRequestId={walk.id} targetType="tutor" targetId={walk.tutor_id} />
              {pet?.id && <ReviewForm walkRequestId={walk.id} targetType="pet" targetId={pet.id} />}
            </>
          )}
        </section>
      )}

      {counterpartId && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-zinc-900">Denúncia</h2>
          <ReportForm reportedUserId={counterpartId} walkRequestId={walk.id} />
        </section>
      )}
    </div>
  );
}
