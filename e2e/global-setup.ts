import { requireE2eEnv } from "./env";

async function globalSetup() {
  requireE2eEnv();
}

export default globalSetup;
