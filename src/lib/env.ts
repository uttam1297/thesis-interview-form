import { z } from "zod";

/**
 * Environment access, split by trust boundary.
 *
 * Both accessors validate lazily. Module-scope validation would run during
 * `next build` (which evaluates every route module to collect page data)
 * and fail the build on any machine without a full environment — a build
 * should not require production secrets. A missing variable instead
 * surfaces as a clear error on the first request that needs it.
 *
 * `publicEnv()` is safe in client components: Next inlines NEXT_PUBLIC_*
 * at build time. `serverEnv()` reads secrets and must only be called from
 * server code.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STUDY_SLUG: z.string().min(1),
});

type PublicEnv = z.infer<typeof publicSchema>;
type ServerEnv = z.infer<typeof serverSchema>;

let cachedPublicEnv: PublicEnv | null = null;
let cachedServerEnv: ServerEnv | null = null;

function describe(error: z.ZodError): string {
  // Names only — never the values, which are secrets.
  return error.issues.map((issue) => issue.path.join(".")).join(", ");
}

export function publicEnv(): PublicEnv {
  if (cachedPublicEnv) return cachedPublicEnv;
  const parsed = publicSchema.safeParse({
    // Referenced statically so Next can inline them into the client bundle.
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `Missing or invalid environment variables: ${describe(parsed.error)}. ` +
        "Set them in .env.local for local development, or in the hosting " +
        "provider's environment settings."
    );
  }
  cachedPublicEnv = parsed.data;
  return cachedPublicEnv;
}

export function serverEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;
  const parsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STUDY_SLUG: process.env.STUDY_SLUG,
  });
  if (!parsed.success) {
    throw new Error(
      `Missing or invalid server environment variables: ${describe(parsed.error)}.`
    );
  }
  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}
