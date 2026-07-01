"use client";
import { useActionState, useTransition } from "react";
import { addAvailability, removeAvailability } from "@/app/(app)/actions/walker";

type FormState = { error?: string; ok?: boolean };

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

type Slot = { id: string; weekday: number; start_time: string; end_time: string };

function RemoveButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        const res = await removeAvailability(id);
        if (res?.error) alert(res.error);
      })}
      className="text-sm font-medium text-red-600 underline disabled:opacity-60"
    >
      {pending ? "Removendo..." : "Remover"}
    </button>
  );
}

export function AvailabilityEditor({ slots }: { slots: Slot[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, fd) => (await addAvailability(fd)) ?? {},
    {},
  );

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <h2 className="text-lg font-medium text-zinc-900">Disponibilidade semanal</h2>

      {slots.length === 0 ? (
        <p className="text-sm text-zinc-600">Nenhum horário cadastrado.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm"
            >
              <span>
                {WEEKDAYS[slot.weekday]}: {slot.start_time.slice(0, 5)} às {slot.end_time.slice(0, 5)}
              </span>
              <RemoveButton id={slot.id} />
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="weekday" className="text-sm font-medium text-zinc-800">
            Dia da semana
          </label>
          <select
            id="weekday"
            name="weekday"
            required
            defaultValue=""
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
          >
            <option value="" disabled>
              Selecione
            </option>
            {WEEKDAYS.map((label, idx) => (
              <option key={idx} value={idx}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="startTime" className="text-sm font-medium text-zinc-800">
            Início
          </label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="endTime" className="text-sm font-medium text-zinc-800">
            Fim
          </label>
          <input
            id="endTime"
            name="endTime"
            type="time"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Adicionando..." : "Adicionar"}
        </button>
      </form>

      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </div>
    </div>
  );
}
