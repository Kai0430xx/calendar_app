import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  testIgnore: process.env.FIREBASE_INTEGRATION
    ? []
    : ["**/firebase-sync.spec.ts"],
  webServer: process.env.FIREBASE_INTEGRATION
    ? undefined
    : [
        {
          command: "npm run dev -- --port 5173",
          url: "http://127.0.0.1:5173",
          reuseExistingServer: !process.env.CI,
        },
        {
          command:
            "VITE_FIREBASE_API_KEY= VITE_FIREBASE_PROJECT_ID= npm run dev -- --port 5174",
          url: "http://127.0.0.1:5174",
          reuseExistingServer: !process.env.CI,
        },
      ],
  use: {
    headless: true,
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: ["--no-sandbox"],
    },
    viewport: { width: 390, height: 844 },
  },
  reporter: "list",
});
