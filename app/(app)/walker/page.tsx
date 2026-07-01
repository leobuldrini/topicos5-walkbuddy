import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { WalkerProfileForm } from "@/components/WalkerProfileForm";
import { WalkerPhotoUpload } from "@/components/WalkerPhotoUpload";
import { AvailabilityEditor } from "@/components/AvailabilityEditor";

export default async function WalkerPage() {
  const user = await requireUser();
  const sb = await createServerClient();

  const { data: profile } = await sb
    .from("walker_profiles")
    .select("bio, experience_years, base_price, service_region, photo_url, accepted_sizes, accepted_behaviors, active")
    .eq("id", user.id)
    .maybeSingle();

  const { data: availability } = await sb
    .from("availability")
    .select("id, weekday, start_time, end_time")
    .eq("walker_id", user.id)
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <div className="flex flex-1 flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Meu Perfil de Passeador</h1>
        <p className="text-sm text-zinc-600">
          Mantenha seus dados atualizados para que os tutores encontrem você.
        </p>
      </div>

      <WalkerProfileForm
        defaultValues={{
          bio: profile?.bio,
          experienceYears: profile?.experience_years ?? 0,
          basePrice: profile?.base_price ?? 0,
          serviceRegion: profile?.service_region,
          acceptedSizes: profile?.accepted_sizes ?? undefined,
          acceptedBehaviors: profile?.accepted_behaviors ?? [],
          active: profile?.active ?? true,
        }}
      />

      <WalkerPhotoUpload photoUrl={profile?.photo_url} />

      <AvailabilityEditor slots={availability ?? []} />
    </div>
  );
}
