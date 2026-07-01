import fs from "node:fs";
import path from "node:path";

export function loadDotenvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return false;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] == null) process.env[key] = value;
  }
  return true;
}

export function requireE2eEnv() {
  loadDotenvLocal();
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"].filter(
    (key) => !process.env[key],
  );

  if (missing.length > 0) {
    throw new Error(
      `E2E requires local Supabase env vars. Missing: ${missing.join(", ")}. Run npx supabase start, copy keys to .env.local, then rerun npm run e2e.`,
    );
  }
}
