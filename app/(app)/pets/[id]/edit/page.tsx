import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { updatePet } from "@/app/(app)/actions/pets";
import { PetForm } from "@/components/PetForm";

export default async function EditPetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const sb = await createServerClient();
  const { data: pet } = await sb
    .from("pets")
    .select("id, name, size, breed, age, behavior, notes")
    .eq("id", id)
    .eq("tutor_id", user.id)
    .single();

  if (!pet) notFound();

  const boundUpdate = updatePet.bind(null, pet.id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Editar pet</h1>
      <PetForm
        submit={boundUpdate}
        submitLabel="Salvar"
        defaultValues={{
          name: pet.name,
          size: pet.size,
          breed: pet.breed ?? undefined,
          age: pet.age,
          behavior: pet.behavior ?? undefined,
          notes: pet.notes ?? undefined,
        }}
      />
    </div>
  );
}
