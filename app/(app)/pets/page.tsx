import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { DeletePetButton } from "@/components/DeletePetButton";

const sizeLabel: Record<string, string> = { PEQUENO: "Pequeno", MEDIO: "Médio", GRANDE: "Grande" };

export default async function PetsPage() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data: pets } = await sb
    .from("pets")
    .select("id, name, size, breed, age")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Meus Pets</h1>
        <Link
          href="/pets/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Novo pet
        </Link>
      </div>

      {!pets || pets.length === 0 ? (
        <p className="text-sm text-zinc-600">Você ainda não cadastrou nenhum pet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pets.map((pet) => (
            <li
              key={pet.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4"
            >
              <div>
                <p className="font-medium text-zinc-900">{pet.name}</p>
                <p className="text-sm text-zinc-600">
                  {sizeLabel[pet.size] ?? pet.size}
                  {pet.breed ? ` · ${pet.breed}` : ""}
                  {pet.age != null ? ` · ${pet.age} ano(s)` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/pets/${pet.id}/edit`}
                  className="text-sm font-medium text-zinc-700 underline"
                >
                  Editar
                </Link>
                <DeletePetButton petId={pet.id} petName={pet.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
