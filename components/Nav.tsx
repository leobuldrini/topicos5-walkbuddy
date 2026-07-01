import Link from "next/link";
import { NotificationBell } from "@/components/NotificationBell";
import { hasRole } from "@/lib/profile";

type NavProfile = { display_name: string; roles: string[]; is_admin?: boolean } | null;

export function Nav({ profile, unread = 0 }: { profile: NavProfile; unread?: number }) {
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
          <>
            <Link href="/pets" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Meus Pets
            </Link>
            <Link href="/walkers" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Passeadores
            </Link>
            <Link href="/walks" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Passeios
            </Link>
          </>
        )}
        {hasRole(profile, "walker") && (
          <>
            <Link href="/walker" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Meu Perfil
            </Link>
            <Link href="/walker/requests" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Solicitações
            </Link>
            <Link href="/walker/earnings" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Ganhos
            </Link>
          </>
        )}
        <NotificationBell unread={unread} />
        {profile?.is_admin && (
          <Link href="/admin" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Admin
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
