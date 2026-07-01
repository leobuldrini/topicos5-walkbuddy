"use client";
import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/app/(app)/actions/auth";
import { Field } from "@/components/ui/Field";

type State = { error?: string };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => (await signIn(formData)) ?? {},
    {},
  );

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Entrar</h1>

        <Field id="email" name="email" label="E-mail" type="email" required autoComplete="email" />
        <Field
          id="password"
          name="password"
          label="Senha"
          type="password"
          required
          autoComplete="current-password"
        />

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
          {pending ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-sm text-zinc-600">
          Não tem conta?{" "}
          <Link href="/signup" className="font-medium text-zinc-900 underline">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
