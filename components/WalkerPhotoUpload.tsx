"use client";
import { useActionState } from "react";
import Image from "next/image";
import { uploadWalkerPhoto } from "@/app/(app)/actions/walker";

type FormState = { error?: string; ok?: boolean; photoUrl?: string };

export function WalkerPhotoUpload({ photoUrl }: { photoUrl?: string | null }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, fd) => (await uploadWalkerPhoto(fd)) ?? {},
    {},
  );

  const currentPhoto = state.photoUrl ?? photoUrl ?? null;

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-3">
      <h2 className="text-lg font-medium text-zinc-900">Foto de perfil</h2>
      {currentPhoto && (
        <Image
          src={currentPhoto}
          alt="Foto de perfil do passeador"
          width={96}
          height={96}
          unoptimized
          className="h-24 w-24 rounded-full object-cover"
        />
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="photo" className="text-sm font-medium text-zinc-800">
          Escolher foto
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          required
          className="text-sm text-zinc-700"
        />
      </div>
      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state.ok && <p className="text-sm text-green-700">Foto enviada com sucesso.</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar foto"}
      </button>
    </form>
  );
}
