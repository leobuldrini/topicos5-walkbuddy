import Link from "next/link";

export function NotificationBell({ unread }: { unread: number }) {
  return (
    <Link href="/notifications" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
      Notificações{unread > 0 ? ` (${unread})` : ""}
    </Link>
  );
}
