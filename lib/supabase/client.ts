import { createBrowserClient as _create } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
export const createBrowserClient = () =>
  _create<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
