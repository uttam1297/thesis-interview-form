# Research interview platform

Data-collection instrument for the master's thesis _From Data to Product
Decisions: Designing an AI-Assisted Product Analytics Framework for Digital
Platforms_.

It collects expert responses in two modes that share one research schema:

- **Asynchronous form** — participants answer on their own, without an account.
- **Live interview** — the researcher records answers during a call.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind 4 ·
shadcn/ui on Base UI · Motion · Zod · Supabase (Postgres, Auth, RLS) ·
Vitest · Playwright.

## Architecture

```
UI (components/)
  → feature/domain logic (features/)
    → data access (features/*/persistence, lib/supabase)
      → Supabase
```

| Layer                | Location                              | Responsibility                                                                                       |
| -------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Questionnaire config | `src/config/interview.ts`             | The research instrument. Zod-validated. No wording lives in components.                              |
| Engine               | `src/features/interview/`             | Pure step derivation, conditional visibility, progress, validation, reducer.                         |
| Persistence          | `src/features/interview/persistence/` | `DraftStorage` / `SubmissionRepository` interfaces with local, synced and in-memory implementations. |
| Sessions             | `src/features/sessions/`              | Server-side session lifecycle and resume-token handling.                                             |
| Voice                | `src/features/voice/`                 | `SpeechRecognitionAdapter` boundary + Web Speech implementation.                                     |
| Admin                | `src/features/admin/`                 | Researcher queries, exports, auth guard.                                                             |

Two rules hold the design together: **question wording is data, never code**,
and **the step list is derived, never stored** — so changing an earlier answer
re-routes later questions and going back never deletes anything.

## Local development

Requires Node 20+, npm and Docker (for the local Supabase stack).

```bash
npm install
npx supabase start          # Postgres, Auth, Studio on 127.0.0.1
cp .env.example .env.local  # then paste the keys `supabase start` printed
npm run db:setup            # researcher account + publish the questionnaire
npm run dev
```

| Service         | URL                                                     |
| --------------- | ------------------------------------------------------- |
| App             | http://localhost:3000                                   |
| Supabase Studio | http://127.0.0.1:54323                                  |
| Postgres        | postgresql://postgres:postgres@127.0.0.1:54322/postgres |

Local researcher sign-in: `12uttamdarekar@gmail.com` / `research-dev-password`
(created by `npm run db:seed-researcher`; local URLs only — the script refuses
to run against a remote project).

## Environment variables

| Variable                        | Where           | Purpose                                                                  |
| ------------------------------- | --------------- | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | client + server | Supabase project URL                                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Public anon key. Grants nothing on its own: no table has an anon policy. |
| `SUPABASE_SERVICE_ROLE_KEY`     | **server only** | Bypasses RLS. Never prefix with `NEXT_PUBLIC_`.                          |
| `STUDY_SLUG`                    | server          | Which study to collect for (`thesis-2026`).                              |

Validation is lazy (`src/lib/env.ts`), so a build succeeds without secrets and
a missing variable fails loudly on first use instead.

## Database

Schema is code: `supabase/migrations/`. Never change production by hand.

```bash
npx supabase db reset   # replay migrations + seed (destroys local data)
npm run db:types        # regenerate src/types/database.ts after a schema change
```

Adding a migration: create `supabase/migrations/000N_description.sql`, run
`db:reset` to verify, then `npx supabase db push` to apply it to the hosted
project.

## Questionnaire configuration

Questions live in `src/config/interview.ts`, typed and Zod-validated. Editing
wording, options, order or branching needs no component changes.

**Publishing:**

```bash
npm run questionnaire:publish
```

This freezes the current config as an immutable version row plus one row per
question. Responses reference those question rows, so collected data always
keeps the wording it was answered under.

**Creating a new version** (required once collection has begun):

1. Edit `src/config/interview.ts`.
2. Bump `version` (e.g. `2.0.0` → `2.1.0`).
3. Run `npm run questionnaire:publish`.

Republishing an existing version with changed content is refused. New sessions
use the newest version; in-flight sessions keep the version they started on.

## Exporting research data

Sign in at `/admin`, then use the export buttons, or call the endpoint directly
while signed in:

| Format          | URL                             | Use                                                               |
| --------------- | ------------------------------- | ----------------------------------------------------------------- |
| CSV             | `/api/admin/export?format=csv`  | Structured analysis (SPSS, R, Excel)                              |
| JSON            | `/api/admin/export?format=json` | Full response structures                                          |
| Qualitative CSV | `/api/admin/export?format=long` | Thematic coding: participant, construct, question, response, mode |

Exports carry `participant_code`, never internal ids or resume tokens, and
always include `response_mode` so live and asynchronous data stay
distinguishable. `method` distinguishes participant-typed, dictated and
researcher-entered answers.

## Recording a live interview

1. Sign in at `/admin` → **Live interview**.
2. Record the consent given verbally. Participation and recording consent are
   separate; leave recording unticked if it was declined or not asked.
3. Work through the same questionnaire the online form uses.

Answers are stored with `response_mode=live_interview` and `method=researcher`.
No audio is stored by this application; any recording is handled outside it
under the approved research procedure.

## Voice input: browser support

| Browser      | Behaviour                             |
| ------------ | ------------------------------------- |
| Chrome, Edge | Supported                             |
| Safari       | Supported (`webkitSpeechRecognition`) |
| Firefox      | Not supported — typing fallback shown |

Requires HTTPS or localhost. Recognition is the browser's own; this application
stores only the editable transcript, never audio. If permission is refused the
control stops offering to retry (browsers remember refusal) and typing
continues to work. Voice is never required to complete the interview.

## Testing

```bash
npm run lint
npm run typecheck
npm test                  # unit (no database needed)
npm run test:integration  # schema + RLS, needs `supabase start`
npm run test:e2e          # Playwright, boots its own dev server
npm run build
```

## Deployment

1. Create a Supabase project (**EU region** for this study's ethics approval).
2. `npx supabase link --project-ref <ref>` then `npx supabase db push`.
3. Create the researcher account in the Supabase dashboard, then insert its
   `researcher_profiles` row — membership is what grants access to all
   participant data, so do it deliberately.
4. Set the four environment variables in the hosting provider. Keep
   `SUPABASE_SERVICE_ROLE_KEY` out of any `NEXT_PUBLIC_` name.
5. Deploy, then run `npm run questionnaire:publish` against the hosted project
   with its environment set.

## Privacy and operational notes

- Participants are pseudonymous: a `P001`-style code for analysis and a
  separate 32-byte resume token, stored only as a SHA-256 hash and expiring
  after 30 days. No names or email addresses are collected.
- The resume link is a bearer credential — anyone holding it can continue that
  session. Treat it accordingly when sending it to participants.
- Anonymous clients have no database access whatsoever. Participant traffic
  goes through server route handlers that resolve a resume token; researchers
  read through RLS policies.
- Logs record error codes and session ids, never response content or tokens.
- Research responses are not sent to any third-party AI provider.
- Consent copy lives in `src/features/consent/content.ts`, drafted around the
  elements a GDPR/DSGVO research consent notice is expected to cover:
  controller, data collected, purpose, legal basis (Art. 6(1)(a)), retention
  and withdrawal. **It is drafted, not approved** — confirm the retention
  period, legal basis and supervisor details with your examiner and HTW's
  data protection office before inviting participants. The `version` string
  is written to every consent record, so bump it whenever the wording
  changes.
- Speech-to-text is consented to separately from participation, and
  declining it disables dictation rather than merely noting the preference.
- Retention is `RETENTION_MONTHS` (currently 5). Each session's delete-by
  date is shown on its admin page. Deletion is not automated — a withdrawal
  request is honoured with the **Withdraw** action on the session page,
  which permanently deletes that participant's responses and records the
  withdrawal against their consent.
- This implements technical privacy measures. It is not, on its own, a claim of
  GDPR compliance — that follows the university's ethics process.

See `docs/PILOT-CHECKLIST.md` before running the pilot.
