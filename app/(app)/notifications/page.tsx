import { markRead } from "@/app/(app)/actions/notifications";
import { ActionFormButton } from "@/components/ActionFormButton";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const user = await requireUser();
  const sb = await createServerClient();
  const { data: notifications } = await sb
    .from("notifications")
    .select("id, type, payload, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Notificações</h1>
      {!notifications || notifications.length === 0 ? (
        <p className="text-sm text-zinc-600">Nenhuma notificação.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <li key={notification.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4">
              <div>
                <p className="font-medium text-zinc-900">{notification.type}</p>
                <p className="text-sm text-zinc-600">{notification.created_at}</p>
              </div>
              {!notification.read && <ActionFormButton action={markRead.bind(null, notification.id)} label="Marcar como lida" variant="secondary" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
