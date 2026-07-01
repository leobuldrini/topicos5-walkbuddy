import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { Nav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const profile = await getProfile();

  return (
    <div className="flex flex-1 flex-col">
      <Nav profile={profile} />
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
