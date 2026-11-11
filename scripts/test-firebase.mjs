import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
const cache = "/tmp/calendar-emulators";
const config = "/tmp/calendar-firebase-config";
mkdirSync(cache, { recursive: true });
mkdirSync(config, { recursive: true });
const child = spawn(
  process.execPath,
  [
    "node_modules/firebase-tools/lib/bin/firebase.js",
    "emulators:exec",
    "--only",
    "auth,firestore",
    "--project",
    "demo-cream-calendar",
    "node scripts/run-integration.mjs",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      FIREBASE_EMULATORS_PATH: cache,
      XDG_CONFIG_HOME: config,
      CI: "1",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
