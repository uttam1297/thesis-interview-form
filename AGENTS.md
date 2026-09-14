<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Questionnaire work

For question-set changes, read `docs/REPOSITORY-GUIDE.md` and
`docs/QUESTIONNAIRE-WORKFLOW.md`. Use the question importer for review artifacts
and the existing renderer. Questionnaire V1 in `src/config/questions.json` and
V2 in `src/config/questionnaires/v2.ts` are immutable after publication; future
versions require additive config, routing, publishing, and storage. Do not
hardcode question wording into components or reuse historical question IDs.
