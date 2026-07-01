import Link from "next/link";
import { getProfile, hasRole } from "@/lib/profile";

export default async function DashboardPage() {
  const profile = await getProfile();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Olá, {profile?.display_name ?? "visitante"}!
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {hasRole(profile, "tutor") && (
          <Link
            href="/pets"
            className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-4 hover:border-zinc-400"
          >
            <h2 className="text-lg font-medium text-zinc-900">Meus Pets</h2>
            <p className="text-sm text-zinc-600">Gerencie os pets cadastrados e agende passeios.</p>
          </Link>
        )}
        {hasRole(profile, "walker") && (
          <Link
            href="/walker"
            className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-4 hover:border-zinc-400"
          >
            <h2 className="text-lg font-medium text-zinc-900">Meu Perfil</h2>
            <p className="text-sm text-zinc-600">Atualize seus dados e disponibilidade como passeador.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
