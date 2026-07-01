import { defineConfig } from "@playwright/test";
import { requireE2eEnv } from "./e2e/env";

requireE2eEnv();

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL: "http://localhost:3000" },
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true },
});
