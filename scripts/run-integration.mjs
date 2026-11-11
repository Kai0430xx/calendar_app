import { spawn } from "node:child_process";
async function run(cmd, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", env });
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(Error(`${cmd} exited ${code}`)),
    );
  });
}
await run(process.execPath, ["--test", "tests/firestore-rules.mjs"]);
// The demo project is deliberately distinct from the live project.
const email = "kai0430xx@gmail.com";
const password = "Emulator-only-12345";
const response = await fetch(
  "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  },
);
if (!response.ok)
  throw Error("Could not create emulator test account: " + response.status);
const vite = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5175"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_USE_FIREBASE_EMULATORS: "true",
      VITE_FIREBASE_API_KEY: "demo-key",
      VITE_FIREBASE_PROJECT_ID: "demo-cream-calendar",
      VITE_FIREBASE_AUTH_DOMAIN: "demo-cream-calendar.firebaseapp.com",
      VITE_FIREBASE_SHARED_EMAIL: email,
    },
  },
);
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch("http://127.0.0.1:5175")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready) throw Error("Vite did not become ready");
  await run(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test", "firebase-sync.spec.ts"],
    { ...process.env, FIREBASE_INTEGRATION: "1" },
  );
} finally {
  vite.kill("SIGTERM");
}
