import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminReviewsPage() {
  const { data: reviews } = await createAdminClient()
    .from("reviews")
    .select("id, target_type, target_id, rating, comment, created_at")
    .order("created_at", { ascending: false });

  return (
    <ul className="flex flex-col gap-2">
      {(reviews ?? []).map((review) => (
        <li key={review.id} className="rounded-lg border border-zinc-200 p-4 text-sm">
          <p className="font-medium text-zinc-900">{review.target_type} · nota {review.rating}</p>
          <p className="text-zinc-600">{review.comment ?? "Sem comentário"}</p>
        </li>
      ))}
    </ul>
  );
}
