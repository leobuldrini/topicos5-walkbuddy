"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";

type PetFormState = { error?: string; ok?: boolean };

type PetDefaults = {
  name?: string;
  size?: string;
  breed?: string;
  age?: number | null;
  behavior?: string;
  notes?: string;
};

export function PetForm({
  submit,
  submitLabel,
  defaultValues,
}: {
  submit: (fd: FormData) => Promise<PetFormState>;
  submitLabel: string;
  defaultValues?: PetDefaults;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<PetFormState, FormData>(
    async (_prev, fd) => (await submit(fd)) ?? {},
    {},
  );

  useEffect(() => {
    if (state.ok) router.push("/pets");
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <Field id="name" name="name" label="Nome" required defaultValue={defaultValues?.name} />

      <div className="flex flex-col gap-1">
        <label htmlFor="size" className="text-sm font-medium text-zinc-800">
          Porte
        </label>
        <select
          id="size"
          name="size"
          required
          defaultValue={defaultValues?.size ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
        >
          <option value="" disabled>
            Selecione o porte
          </option>
          <option value="PEQUENO">Pequeno</option>
          <option value="MEDIO">Médio</option>
          <option value="GRANDE">Grande</option>
        </select>
      </div>

      <Field id="breed" name="breed" label="Raça" defaultValue={defaultValues?.breed} />
      <Field
        id="age"
        name="age"
        label="Idade (anos)"
        type="number"
        defaultValue={defaultValues?.age != null ? String(defaultValues.age) : undefined}
      />
      <Field id="behavior" name="behavior" label="Comportamento" defaultValue={defaultValues?.behavior} />
      <Field id="notes" name="notes" label="Observações" defaultValue={defaultValues?.notes} />

      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
