"use client";
import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/app/(app)/actions/auth";
import { Field } from "@/components/ui/Field";

type State = { error?: string };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => (await signUp(formData)) ?? {},
    {},
  );

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Criar conta</h1>

        <Field id="displayName" name="displayName" label="Nome" required autoComplete="name" />
        <Field id="email" name="email" label="E-mail" type="email" required autoComplete="email" />
        <Field
          id="password"
          name="password"
          label="Senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-zinc-800">Você é</legend>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" name="roles" value="tutor" className="h-4 w-4" />
            Tutor(a) de pet
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" name="roles" value="walker" className="h-4 w-4" />
            Passeador(a)
          </label>
        </fieldset>

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
          {pending ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="text-sm text-zinc-600">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
