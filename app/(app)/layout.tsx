import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { createServerClient } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getProfile();
  const sb = await createServerClient();
  const { count } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);
  const unread = count ?? 0;

  return (
    <div className="flex flex-1 flex-col">
      <Nav profile={profile} unread={unread} />
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
