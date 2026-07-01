"use client";

import { useActionState } from "react";
import { submitReview } from "@/app/(app)/actions/reviews";

type State = { error?: string; ok?: boolean };

export function ReviewForm({
  walkRequestId,
  targetType,
  targetId,
}: {
  walkRequestId: string;
  targetType: "walker" | "tutor" | "pet";
  targetId: string;
}) {
  const [state, action, pending] = useActionState<State, FormData>(async (_prev, fd) => (await submitReview(fd)) ?? {}, {});

  return (
    <form action={action} className="flex max-w-md flex-col gap-3">
      <input type="hidden" name="walkRequestId" value={walkRequestId} />
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <label htmlFor={`rating-${targetType}`} className="text-sm font-medium text-zinc-800">
        Nota
      </label>
      <select id={`rating-${targetType}`} name="rating" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
        <option value="">Selecione</option>
        {[1, 2, 3, 4, 5].map((rating) => (
          <option key={rating} value={rating}>
            {rating}
          </option>
        ))}
      </select>
      <label htmlFor={`comment-${targetType}`} className="text-sm font-medium text-zinc-800">
        Comentário
      </label>
      <textarea id={`comment-${targetType}`} name="comment" rows={3} className="rounded-md border border-zinc-300 px-3 py-2 text-sm" />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700">Avaliação registrada.</p>}
      <button type="submit" disabled={pending} className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Enviando..." : "Avaliar"}
      </button>
    </form>
  );
}
