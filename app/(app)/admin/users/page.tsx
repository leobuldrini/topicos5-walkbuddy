import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminUsersPage() {
  const { data: users } = await createAdminClient()
    .from("profiles")
    .select("id, display_name, roles, is_admin, created_at")
    .order("created_at", { ascending: false });

  return (
    <ul className="flex flex-col gap-2">
      {(users ?? []).map((user) => (
        <li key={user.id} className="rounded-lg border border-zinc-200 p-4 text-sm">
          <p className="font-medium text-zinc-900">{user.display_name}</p>
          <p className="text-zinc-600">{user.roles.join(", ")}{user.is_admin ? " · admin" : ""}</p>
        </li>
      ))}
    </ul>
  );
}
