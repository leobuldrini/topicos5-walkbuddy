import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { WalkRequestForm } from "@/components/WalkRequestForm";

export default async function NewWalkPage({
  searchParams,
}: {
  searchParams: Promise<{ walkerId?: string }>;
}) {
  const user = await requireUser();
  const { walkerId } = await searchParams;
  const sb = await createServerClient();
  const [{ data: pets }, { data: walkers }] = await Promise.all([
    sb.from("pets").select("id, name").eq("tutor_id", user.id).order("name", { ascending: true }),
    sb
      .from("walker_profiles")
      .select("id, service_region, base_price, profiles(display_name)")
      .eq("active", true)
      .order("base_price", { ascending: true }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Solicitar passeio</h1>
        <p className="text-sm text-zinc-600">Informe pet, região, data e horário para criar a solicitação.</p>
      </div>

      {pets && pets.length > 0 ? (
        <WalkRequestForm pets={pets} walkers={walkers ?? []} defaultWalkerId={walkerId} />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600">Cadastre um pet antes de solicitar um passeio.</p>
          <Link href="/pets/new" className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
            Cadastrar pet
          </Link>
        </div>
      )}
    </div>
  );
}
