import { createPet } from "@/app/(app)/actions/pets";
import { PetForm } from "@/components/PetForm";

export default function NewPetPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Novo pet</h1>
      <PetForm submit={createPet} submitLabel="Cadastrar" />
    </div>
  );
}
