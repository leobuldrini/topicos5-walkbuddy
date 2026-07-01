import { setReportStatus } from "@/app/(app)/actions/admin";
import { ActionFormButton } from "@/components/ActionFormButton";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminReportsPage() {
  const { data: reports } = await createAdminClient()
    .from("reports")
    .select("id, reason, status, reporter_id, reported_user_id, created_at")
    .order("created_at", { ascending: false });

  return (
    <ul className="flex flex-col gap-2">
      {(reports ?? []).map((report) => (
        <li key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 text-sm">
          <div>
            <p className="font-medium text-zinc-900">{report.status}</p>
            <p className="text-zinc-600">{report.reason}</p>
          </div>
          <div className="flex gap-2">
            <ActionFormButton action={setReportStatus.bind(null, report.id, "em_analise")} label="Em análise" variant="secondary" />
            <ActionFormButton action={setReportStatus.bind(null, report.id, "resolvida")} label="Resolvida" />
          </div>
        </li>
      ))}
    </ul>
  );
}
