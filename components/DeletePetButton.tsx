"use client";
import { useTransition } from "react";
import { deletePet } from "@/app/(app)/actions/pets";

export function DeletePetButton({ petId, petName }: { petId: string; petName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Excluir ${petName}?`)) return;
        startTransition(async () => {
          const res = await deletePet(petId);
          if (res?.error) alert(res.error);
        });
      }}
      className="text-sm font-medium text-red-600 underline disabled:opacity-60"
    >
      {pending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
