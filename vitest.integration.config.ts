import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Integration tests run against the local Supabase stack
 * (`npx supabase start`). Kept separate from the unit suite so the default
 * `npm test` needs no database.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/integration/**/*.test.ts"],
    // Shared database: sequential runs keep participant counters predictable.
    fileParallelism: false,
    testTimeout: 20000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      STUDY_SLUG: "thesis-2026",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The `server-only` guard throws outside a React server bundle; these
      // tests exercise the same modules directly in Node.
      "server-only": fileURLToPath(
        new URL("./src/tests/integration/server-only-stub.ts", import.meta.url)
      ),
    },
  },
});
