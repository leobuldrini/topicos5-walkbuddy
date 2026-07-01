"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/log";
import { petSchema } from "@/lib/validation/pet";

function parse(fd: FormData) {
  return petSchema.safeParse({
    name: fd.get("name"), size: fd.get("size"), breed: fd.get("breed") || undefined,
    age: fd.get("age") || undefined, behavior: fd.get("behavior") || undefined, notes: fd.get("notes") || undefined,
  });
}
export async function createPet(fd: FormData) {
  const user = await requireUser();
  const p = parse(fd); if (!p.success) return { error: p.error.issues[0].message };
  const sb = await createServerClient();
  const { data, error } = await sb.from("pets").insert({ ...p.data, tutor_id: user.id }).select("id").single();
  if (error) return { error: "Não foi possível salvar o pet" };
  await logAction({ actorId: user.id, action: "pet.create", entity: "pets", entityId: data.id });
  revalidatePath("/pets"); return { ok: true };
}
export async function updatePet(id: string, fd: FormData) {
  const user = await requireUser();
  const p = parse(fd); if (!p.success) return { error: p.error.issues[0].message };
  const sb = await createServerClient();
  const { error } = await sb.from("pets").update(p.data).eq("id", id).eq("tutor_id", user.id);
  if (error) return { error: "Não foi possível atualizar o pet" };
  await logAction({ actorId: user.id, action: "pet.update", entity: "pets", entityId: id });
  revalidatePath("/pets"); return { ok: true };
}
export async function deletePet(id: string) {
  const user = await requireUser();
  const sb = await createServerClient();
  const { error } = await sb.from("pets").delete().eq("id", id).eq("tutor_id", user.id);
  if (error) return { error: "Não foi possível excluir o pet" };
  await logAction({ actorId: user.id, action: "pet.delete", entity: "pets", entityId: id });
  revalidatePath("/pets"); return { ok: true };
}
