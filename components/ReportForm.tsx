"use client";

import { useActionState } from "react";
import { submitReport } from "@/app/(app)/actions/reports";

type State = { error?: string; ok?: boolean };

export function ReportForm({ reportedUserId, walkRequestId }: { reportedUserId: string; walkRequestId?: string }) {
  const [state, action, pending] = useActionState<State, FormData>(async (_prev, fd) => (await submitReport(fd)) ?? {}, {});

  return (
    <form action={action} className="flex max-w-md flex-col gap-2">
      <input type="hidden" name="reportedUserId" value={reportedUserId} />
      {walkRequestId && <input type="hidden" name="walkRequestId" value={walkRequestId} />}
      <label htmlFor="reason" className="text-sm font-medium text-zinc-800">
        Motivo da denúncia
      </label>
      <textarea id="reason" name="reason" required rows={3} className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700">Denúncia enviada.</p>}
      <button type="submit" disabled={pending} className="w-fit rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 disabled:opacity-60">
        {pending ? "Enviando..." : "Enviar denúncia"}
      </button>
    </form>
  );
}
