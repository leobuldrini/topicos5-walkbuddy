"use client";
import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { saveWalkerProfile } from "@/app/(app)/actions/walker";

type FormState = { error?: string; ok?: boolean };

const SIZES: { value: "PEQUENO" | "MEDIO" | "GRANDE"; label: string }[] = [
  { value: "PEQUENO", label: "Pequeno" },
  { value: "MEDIO", label: "Médio" },
  { value: "GRANDE", label: "Grande" },
];

type WalkerProfileDefaults = {
  bio?: string | null;
  experienceYears?: number;
  basePrice?: number;
  serviceRegion?: string | null;
  acceptedSizes?: string[];
  acceptedBehaviors?: string[];
  active?: boolean;
};

export function WalkerProfileForm({ defaultValues }: { defaultValues?: WalkerProfileDefaults }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, fd) => (await saveWalkerProfile(fd)) ?? {},
    {},
  );

  const acceptedSizes = defaultValues?.acceptedSizes ?? ["PEQUENO", "MEDIO", "GRANDE"];

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-4">
      <Field
        id="bio"
        name="bio"
        label="Biografia"
        defaultValue={defaultValues?.bio ?? undefined}
      />
      <Field
        id="experienceYears"
        name="experienceYears"
        label="Anos de experiência"
        type="number"
        required
        defaultValue={String(defaultValues?.experienceYears ?? 0)}
      />
      <Field
        id="basePrice"
        name="basePrice"
        label="Preço base (R$)"
        type="number"
        step="0.01"
        required
        defaultValue={
          defaultValues?.basePrice != null ? String(defaultValues.basePrice) : undefined
        }
      />
      <Field
        id="serviceRegion"
        name="serviceRegion"
        label="Região de atendimento"
        required
        defaultValue={defaultValues?.serviceRegion ?? undefined}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-zinc-800">Portes aceitos</legend>
        <div className="flex flex-wrap gap-4">
          {SIZES.map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-sm text-zinc-800">
              <input
                type="checkbox"
                name="acceptedSizes"
                value={s.value}
                defaultChecked={acceptedSizes.includes(s.value)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        id="acceptedBehaviors"
        name="acceptedBehaviors"
        label="Comportamentos aceitos (separados por vírgula)"
        defaultValue={defaultValues?.acceptedBehaviors?.join(", ")}
      />

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Perfil ativo (visível para tutores)
      </label>

      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state.ok && <p className="text-sm text-green-700">Perfil salvo com sucesso.</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar perfil"}
      </button>
    </form>
  );
}
