import { z } from "zod";

/**
 * Environment access, split by trust boundary.
 *
 * `publicEnv` is safe to reference from client components (Next inlines
 * NEXT_PUBLIC_* at build time). `serverEnv()` reads secrets and must only
 * ever be called from server code — importing it into a client component
 * fails the build, which is the point.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STUDY_SLUG: z.string().min(1),
});

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

export function serverEnv(): z.infer<typeof serverSchema> {
  cachedServerEnv ??= serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STUDY_SLUG: process.env.STUDY_SLUG,
  });
  return cachedServerEnv;
}
