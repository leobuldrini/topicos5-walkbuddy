import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Admin</h1>
        <nav className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/admin" className="font-medium text-zinc-700 underline">Resumo</Link>
          <Link href="/admin/users" className="font-medium text-zinc-700 underline">Usuários</Link>
          <Link href="/admin/walks" className="font-medium text-zinc-700 underline">Passeios</Link>
          <Link href="/admin/reviews" className="font-medium text-zinc-700 underline">Avaliações</Link>
          <Link href="/admin/reports" className="font-medium text-zinc-700 underline">Denúncias</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
