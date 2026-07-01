import { createServerClient as _create } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createServerClient() {
  const store = await cookies();
  return _create<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
      },
    },
  );
}
