import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { Json, TablesInsert } from "@/lib/database.types";
import { rankWalkers } from "@/lib/recommender/rank";
import type { Candidate, PetSize, RankedWalker } from "@/lib/recommender/types";

export async function loadCandidates(region: string): Promise<Candidate[]> {
  const sb = await createServerClient();
  const { data } = await sb
    .from("walker_profiles")
    .select("id, service_region, experience_years, base_price, active, accepted_sizes, accepted_behaviors, availability(weekday,start_time,end_time)")
    .eq("active", true)
    .ilike("service_region", region);
  const ids = (data ?? []).map((walker) => walker.id);
  const { data: ratings } =
    ids.length > 0 ? await sb.from("walker_ratings").select("walker_id, avg_rating").in("walker_id", ids) : { data: [] };
  const ratingByWalker = new Map((ratings ?? []).map((rating) => [rating.walker_id, rating.avg_rating]));

  return (data ?? []).map((walker) => ({
    walkerId: walker.id,
    region,
    serviceRegion: walker.service_region ?? "",
    slots: walker.availability ?? [],
    acceptsSizes: walker.accepted_sizes ?? ["PEQUENO", "MEDIO", "GRANDE"],
    acceptsBehaviors: walker.accepted_behaviors ?? [],
    experienceYears: walker.experience_years ?? 0,
    basePrice: Number(walker.base_price ?? 0),
    avgRating: Number(ratingByWalker.get(walker.id) ?? 0) || null,
    active: walker.active,
  }));
}

export async function recommendForRequest(requestId: string): Promise<RankedWalker[]> {
  const sb = await createServerClient();
  const { data: request } = await sb
    .from("walk_requests")
    .select("region, scheduled_date, start_time, pet:pets(size, behavior), price_estimate")
    .eq("id", requestId)
    .single();

  if (!request) return [];

  const pet = Array.isArray(request.pet) ? request.pet[0] : request.pet;
  if (!pet) return [];

  const weekday = new Date(`${request.scheduled_date}T00:00:00`).getDay();
  const ranked = rankWalkers({
    requestId,
    region: request.region,
    weekday,
    startTime: request.start_time,
    petSize: pet.size as PetSize,
    petBehavior: pet.behavior ?? "",
    expectedPrice: Number(request.price_estimate ?? 0),
    candidates: await loadCandidates(request.region),
  });

  const admin = createAdminClient();
  await admin.from("recommendation_logs").delete().eq("walk_request_id", requestId);
  if (ranked.length > 0) {
    const rows: TablesInsert<"recommendation_logs">[] = ranked.map((walker, index) => ({
        walk_request_id: requestId,
        walker_id: walker.walkerId,
        score: walker.score,
        rank: index + 1,
        factors: walker.reasons as unknown as Json,
      }));
    await admin.from("recommendation_logs").insert(rows);
  }

  return ranked;
}

export async function markChosen(requestId: string, walkerId: string) {
  await createAdminClient()
    .from("recommendation_logs")
    .update({ chosen: true })
    .eq("walk_request_id", requestId)
    .eq("walker_id", walkerId);
}
