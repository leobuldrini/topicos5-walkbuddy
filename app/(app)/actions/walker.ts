"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/log";
import { walkerSchema, availabilitySchema } from "@/lib/validation/walker";

export async function saveWalkerProfile(fd: FormData) {
  const user = await requireUser();
  const p = walkerSchema.safeParse({
    bio: fd.get("bio") || undefined,
    experienceYears: fd.get("experienceYears"),
    basePrice: fd.get("basePrice"),
    serviceRegion: fd.get("serviceRegion"),
    acceptedSizes: fd.getAll("acceptedSizes"),
    acceptedBehaviors: (fd.get("acceptedBehaviors") as string | null)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [],
  });
  if (!p.success) return { error: p.error.issues[0].message };
  const sb = await createServerClient();
  const { error } = await sb.from("walker_profiles").upsert({
    id: user.id,
    bio: p.data.bio ?? null,
    experience_years: p.data.experienceYears,
    base_price: p.data.basePrice,
    service_region: p.data.serviceRegion,
    accepted_sizes: p.data.acceptedSizes,
    accepted_behaviors: p.data.acceptedBehaviors,
    active: fd.get("active") === "on",
  });
  if (error) return { error: "Não foi possível salvar o perfil de passeador" };
  await logAction({ actorId: user.id, action: "walker.save", entity: "walker_profiles", entityId: user.id });
  revalidatePath("/walker");
  return { ok: true };
}

export async function uploadWalkerPhoto(fd: FormData) {
  const user = await requireUser();
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecione uma foto" };
  const sb = await createServerClient();
  const path = `${user.id}`;
  const { error: uploadError } = await sb.storage
    .from("walker-photos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: "Não foi possível enviar a foto" };
  const { data: publicUrlData } = sb.storage.from("walker-photos").getPublicUrl(path);
  const { error } = await sb
    .from("walker_profiles")
    .upsert({ id: user.id, photo_url: publicUrlData.publicUrl });
  if (error) return { error: "Não foi possível salvar a foto no perfil" };
  await logAction({ actorId: user.id, action: "walker.photo_upload", entity: "walker_profiles", entityId: user.id });
  revalidatePath("/walker");
  return { ok: true, photoUrl: publicUrlData.publicUrl };
}

export async function addAvailability(fd: FormData) {
  const user = await requireUser();
  const p = availabilitySchema.safeParse({
    weekday: fd.get("weekday"),
    startTime: fd.get("startTime"),
    endTime: fd.get("endTime"),
  });
  if (!p.success) return { error: p.error.issues[0].message };
  const sb = await createServerClient();
  const { data, error } = await sb
    .from("availability")
    .insert({
      walker_id: user.id,
      weekday: p.data.weekday,
      start_time: p.data.startTime,
      end_time: p.data.endTime,
    })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível adicionar o horário" };
  await logAction({ actorId: user.id, action: "availability.create", entity: "availability", entityId: data.id });
  revalidatePath("/walker");
  return { ok: true };
}

export async function removeAvailability(id: string) {
  const user = await requireUser();
  const sb = await createServerClient();
  const { error } = await sb.from("availability").delete().eq("id", id).eq("walker_id", user.id);
  if (error) return { error: "Não foi possível remover o horário" };
  await logAction({ actorId: user.id, action: "availability.delete", entity: "availability", entityId: id });
  revalidatePath("/walker");
  return { ok: true };
}
