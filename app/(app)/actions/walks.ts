"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logAction } from "@/lib/log";
import { notify } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/database.types";
import { walkSchema } from "@/lib/validation/walk";
import { isAvailableAt } from "@/lib/walks/matching";
import { estimatePrice } from "@/lib/walks/price";
import { nextStatus, type WalkAction, type WalkStatus } from "@/lib/walks/statusMachine";

function parseWalk(fd: FormData) {
  return walkSchema.safeParse({
    petId: fd.get("petId"),
    region: fd.get("region"),
    date: fd.get("date"),
    startTime: fd.get("startTime"),
    durationMin: fd.get("durationMin"),
    locationText: fd.get("locationText") || undefined,
    walkerId: fd.get("walkerId") || undefined,
  });
}

function weekdayFromDate(date: string): number {
  return new Date(`${date}T00:00:00`).getDay();
}

export async function createWalkRequest(fd: FormData) {
  const user = await requireUser();
  const parsed = parseWalk(fd);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const sb = await createServerClient();
  const { data: pet } = await sb
    .from("pets")
    .select("id, size")
    .eq("id", parsed.data.petId)
    .eq("tutor_id", user.id)
    .single();
  if (!pet) return { error: "Pet não encontrado" };

  let price = 0;
  if (parsed.data.walkerId) {
    const { data: walker } = await sb
      .from("walker_profiles")
      .select("base_price")
      .eq("id", parsed.data.walkerId)
      .single();
    if (walker) {
      price = estimatePrice({
        basePrice: Number(walker.base_price),
        durationMin: parsed.data.durationMin,
        size: pet.size,
      });
    }
  }

  const { data, error } = await sb
    .from("walk_requests")
    .insert({
      tutor_id: user.id,
      pet_id: parsed.data.petId,
      walker_id: parsed.data.walkerId ?? null,
      region: parsed.data.region,
      scheduled_date: parsed.data.date,
      start_time: parsed.data.startTime,
      duration_min: parsed.data.durationMin,
      location_text: parsed.data.locationText ?? null,
      price_estimate: price,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível criar a solicitação" };
  await logAction({ actorId: user.id, action: "walk.create", entity: "walk_requests", entityId: data.id });
  revalidatePath("/walks");
  return { ok: true, id: data.id };
}

async function ensureWalkerCanHandle(actorId: string, walk: {
  walker_id: string | null;
  region: string;
  scheduled_date: string;
  start_time: string;
  pet: { size: "PEQUENO" | "MEDIO" | "GRANDE" } | null;
}) {
  if (walk.walker_id && walk.walker_id !== actorId) return false;
  const admin = createAdminClient();
  const { data: walker } = await admin
    .from("walker_profiles")
    .select("id, service_region, active, accepted_sizes, availability(weekday,start_time,end_time)")
    .eq("id", actorId)
    .single();

  if (!walker?.active) return false;
  if ((walker.service_region ?? "").toLowerCase() !== walk.region.toLowerCase()) return false;
  if (walk.pet && !walker.accepted_sizes.includes(walk.pet.size)) return false;
  return isAvailableAt(walker.availability ?? [], weekdayFromDate(walk.scheduled_date), walk.start_time);
}

async function transition(id: string, action: WalkAction, actorId: string, extra?: { reason?: string }) {
  const admin = createAdminClient();
  const { data: walk } = await admin
    .from("walk_requests")
    .select("status, tutor_id, walker_id, price_estimate, region, scheduled_date, start_time, pet:pets(size)")
    .eq("id", id)
    .single();

  if (!walk) return { error: "Passeio não encontrado" };

  if (action === "accept" || action === "reject") {
    const allowed = await ensureWalkerCanHandle(actorId, {
      walker_id: walk.walker_id,
      region: walk.region,
      scheduled_date: walk.scheduled_date,
      start_time: walk.start_time,
      pet: Array.isArray(walk.pet) ? walk.pet[0] ?? null : walk.pet,
    });
    if (!allowed) return { error: "Você não pode alterar esta solicitação" };
  }

  if ((action === "start" || action === "complete") && walk.walker_id !== actorId) {
    return { error: "Apenas o passeador responsável pode avançar este passeio" };
  }

  if (action === "cancel" && walk.tutor_id !== actorId && walk.walker_id !== actorId) {
    return { error: "Você não pode cancelar este passeio" };
  }

  let status: WalkStatus;
  try {
    status = nextStatus(walk.status, action);
  } catch (error) {
    return { error: (error as Error).message };
  }

  const patch: TablesUpdate<"walk_requests"> = { status, updated_at: new Date().toISOString() };
  if (action === "accept") patch.walker_id = actorId;
  if (action === "reject") patch.walker_id = null;
  if (action === "cancel") {
    patch.cancel_reason = extra?.reason ?? "";
    patch.cancelled_by = actorId;
  }

  const { error } = await admin.from("walk_requests").update(patch).eq("id", id);
  if (error) return { error: "Não foi possível atualizar o passeio" };

  if (action === "accept") {
    await admin.from("payments").upsert(
      { walk_request_id: id, amount: Number(walk.price_estimate), status: "pendente" },
      { onConflict: "walk_request_id" },
    );
  }
  if (action === "complete") {
    await admin.from("payments").update({ status: "pago" }).eq("walk_request_id", id);
  }

  await logAction({ actorId, action: `walk.${action}`, entity: "walk_requests", entityId: id });
  if (action === "accept") await notify(walk.tutor_id, "walk.accepted", { id });
  if (action === "start") await notify(walk.tutor_id, "walk.started", { id });
  if (action === "complete") await notify(walk.tutor_id, "walk.completed", { id });
  if (action === "cancel") {
    const counterpart = actorId === walk.tutor_id ? walk.walker_id : walk.tutor_id;
    if (counterpart) await notify(counterpart, "walk.cancelled", { id });
  }
  revalidatePath("/walks");
  revalidatePath("/walker/requests");
  revalidatePath(`/walks/${id}`);
  return { ok: true };
}

export async function acceptWalk(id: string) {
  const user = await requireUser();
  return transition(id, "accept", user.id);
}

export async function rejectWalk(id: string) {
  const user = await requireUser();
  return transition(id, "reject", user.id);
}

export async function startWalk(id: string) {
  const user = await requireUser();
  return transition(id, "start", user.id);
}

export async function completeWalk(id: string) {
  const user = await requireUser();
  return transition(id, "complete", user.id);
}

export async function cancelWalk(id: string, fd: FormData) {
  const user = await requireUser();
  const reason = String(fd.get("reason") ?? "").trim();
  if (!reason) return { error: "Informe o motivo do cancelamento" };
  return transition(id, "cancel", user.id, { reason });
}

export async function chooseWalker(id: string, walkerId: string) {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data: walk } = await sb
    .from("walk_requests")
    .select("id, pet:pets(size), duration_min")
    .eq("id", id)
    .eq("tutor_id", user.id)
    .eq("status", "solicitado")
    .single();
  if (!walk) return { error: "Solicitação não encontrada" };

  const { data: walker } = await sb.from("walker_profiles").select("base_price").eq("id", walkerId).single();
  const pet = Array.isArray(walk.pet) ? walk.pet[0] : walk.pet;
  const price =
    walker && pet
      ? estimatePrice({ basePrice: Number(walker.base_price), durationMin: walk.duration_min, size: pet.size })
      : 0;

  const { error } = await sb
    .from("walk_requests")
    .update({ walker_id: walkerId, price_estimate: price, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tutor_id", user.id);
  if (error) return { error: "Não foi possível escolher o passeador" };

  await logAction({
    actorId: user.id,
    action: "walk.choose_walker",
    entity: "walk_requests",
    entityId: id,
    metadata: { walkerId },
  });
  revalidatePath("/walks");
  revalidatePath(`/walks/${id}`);
  return { ok: true };
}
