import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/unit/**/*.test.{ts,tsx}"],
    css: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Build-time guard in the app; irrelevant when unit-testing the same
      // modules directly.
      "server-only": fileURLToPath(
        new URL("./src/tests/server-only-stub.ts", import.meta.url)
      ),
    },
  },
});
