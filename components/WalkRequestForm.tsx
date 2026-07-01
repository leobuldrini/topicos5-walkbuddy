"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWalkRequest } from "@/app/(app)/actions/walks";
import { Field } from "@/components/ui/Field";

type Pet = { id: string; name: string };
type Walker = { id: string; service_region: string | null; base_price: number; profiles: { display_name: string } | null };
type FormState = { error?: string; ok?: boolean; id?: string };

export function WalkRequestForm({
  pets,
  walkers,
  defaultWalkerId,
}: {
  pets: Pet[];
  walkers: Walker[];
  defaultWalkerId?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, fd) => (await createWalkRequest(fd)) ?? {},
    {},
  );

  useEffect(() => {
    if (state.ok) router.push(state.id ? `/walks/${state.id}` : "/walks");
  }, [router, state.id, state.ok]);

  return (
    <form action={formAction} className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="petId" className="text-sm font-medium text-zinc-800">
          Pet
        </label>
        <select id="petId" name="petId" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
          <option value="">Selecione um pet</option>
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="walkerId" className="text-sm font-medium text-zinc-800">
          Passeador
        </label>
        <select
          id="walkerId"
          name="walkerId"
          defaultValue={defaultWalkerId ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">Escolher depois</option>
          {walkers.map((walker) => (
            <option key={walker.id} value={walker.id}>
              {walker.profiles?.display_name ?? "Passeador"} - {walker.service_region ?? "região não informada"} - R${" "}
              {Number(walker.base_price).toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      <Field id="region" name="region" label="Região" required />
      <Field id="date" name="date" label="Data" type="date" required />
      <Field id="startTime" name="startTime" label="Horário" type="time" required />
      <Field id="durationMin" name="durationMin" label="Duração (minutos)" type="number" required defaultValue="60" />
      <Field id="locationText" name="locationText" label="Local de encontro" />

      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || pets.length === 0}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Solicitar passeio"}
      </button>
    </form>
  );
}
