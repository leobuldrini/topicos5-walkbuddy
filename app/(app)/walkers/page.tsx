import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

export default async function WalkersPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region = "" } = await searchParams;
  const sb = await createServerClient();
  let query = sb
    .from("walker_profiles")
    .select("id, service_region, experience_years, base_price, accepted_sizes, profiles(display_name)")
    .eq("active", true)
    .order("base_price", { ascending: true });

  if (region.trim()) query = query.ilike("service_region", `%${region.trim()}%`);
  const { data: walkers } = await query;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Encontrar passeadores</h1>
        <p className="text-sm text-zinc-600">Filtre por região e escolha alguém compatível para solicitar um passeio.</p>
      </div>

      <form className="flex max-w-md flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="region" className="text-sm font-medium text-zinc-800">
            Região
          </label>
          <input
            id="region"
            name="region"
            defaultValue={region}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          />
        </div>
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          Filtrar
        </button>
      </form>

      {!walkers || walkers.length === 0 ? (
        <p className="text-sm text-zinc-600">Nenhum passeador encontrado.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {walkers.map((walker) => (
            <li key={walker.id} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
              <div>
                <p className="font-medium text-zinc-900">{walker.profiles?.display_name ?? "Passeador"}</p>
                <p className="text-sm text-zinc-600">
                  {walker.service_region ?? "Região não informada"} · {walker.experience_years} ano(s) · R${" "}
                  {Number(walker.base_price).toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">Portes: {walker.accepted_sizes.join(", ")}</p>
              </div>
              <Link
                href={`/walks/new?walkerId=${walker.id}`}
                className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
              >
                Solicitar passeio
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
