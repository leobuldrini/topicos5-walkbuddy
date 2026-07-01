import Link from "next/link";
import { hasRole } from "@/lib/profile";

type NavProfile = { display_name: string; roles: string[] } | null;

export function Nav({ profile }: { profile: NavProfile }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/dashboard" className="text-sm font-semibold text-zinc-900">
          Walk Buddy
        </Link>
        {hasRole(profile, "tutor") && (
          <Link href="/pets" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Meus Pets
          </Link>
        )}
        {hasRole(profile, "walker") && (
          <Link href="/walker" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Meu Perfil
          </Link>
        )}
      </div>
      <form action="/logout" method="post">
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Sair
        </button>
      </form>
    </nav>
  );
}
