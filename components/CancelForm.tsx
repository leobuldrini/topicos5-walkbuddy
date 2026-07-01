"use client";

import { useActionState } from "react";

type FormState = { error?: string; ok?: boolean };

export function CancelForm({ action }: { action: (fd: FormData) => Promise<FormState | void> }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, fd) => (await action(fd)) ?? {},
    {},
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-2">
      <label htmlFor="reason" className="text-sm font-medium text-zinc-800">
        Motivo do cancelamento
      </label>
      <textarea
        id="reason"
        name="reason"
        required
        rows={3}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
      />
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "Cancelando..." : "Cancelar passeio"}
      </button>
    </form>
  );
}
