# From questions to a finished interview form

The user can supply questions in chat or a document. The assistant handles
structuring them, importing the configuration, checking the resulting flow and
preparing the existing application. The user does not need to author TypeScript
or choose a replacement design.

## Input contract

Keep supplied question wording and order. Carry over explicit options, required
or optional status, section headings and branching. If only question text is
provided, the importer uses required `voice_or_text` questions, with typing
always available and dictation gated by the existing consent and browser support.
It does not invent choices, research constructs or conditional logic.

A plain `.txt` or `.md` file contains one question per nonempty line. Numbered or
bulleted lists are accepted. Every Markdown heading defines a section, so omit
a document-title heading and introductory paragraphs. Wrapped questions should
be joined onto one line. Blank lines are ignored. All text after a heading belongs
to that section until the next heading. Use JSON for answer options and other
metadata; a bullet below a question in a text file is another question.

```markdown
# Your experience

1. What does your current role involve?
2. Walk me through a recent decision you made.

# Improvements

3. What made that decision difficult?
4. What would have helped you?
```

The minimal JSON equivalent is an array of question strings:

```json
["What does your current role involve?", "What would have helped you?"]
```

Structured JSON uses `{ "questions": [...] }`, with optional `sections` and
`version`. Each question needs only `prompt`. Optional fields match the complete
questionnaire contract in `src/types/interview.ts`:

| Field                  | Default or purpose                                                             |
| ---------------------- | ------------------------------------------------------------------------------ |
| `id`                   | `q1`, `q2`, …; supply stable explicit IDs when branching or comparing versions |
| `title`                | Question prompt; supply a shorter review label if useful                       |
| `sectionId`            | First section; without sections, a single “Questions” section is created       |
| `responseType`         | `voice_or_text`                                                                |
| `required`             | `true`, except `optional_elaboration`, which defaults to `false`               |
| `construct`            | `general`; provide research construct names when known                         |
| `description`, `aside` | Supporting copy and answer guidance                                            |
| `showIf`               | Conditions on earlier questions; every condition must hold                     |
| `researchMetadata`     | Research question references and researcher follow-up probes                   |

| Response type                              | Additional settings                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `short_text`, `long_text`, `voice_or_text` | Optional `validation.minLength`, `validation.maxLength`                                 |
| `optional_elaboration`                     | Must be optional; optional `parentQuestionId`, text limits and explicit `showIf`        |
| `single_select`                            | At least two `options`; optional `allowOther`                                           |
| `multi_select`                             | At least two `options`; optional `allowOther`, `validation.minSelections/maxSelections` |
| `likert_scale`                             | Integer `min` and `max`, max greater than min; optional endpoint labels                 |
| `ranking`                                  | At least two `options`                                                                  |

Options may be strings or `{ "value": "stable_key", "label": "Visible text" }`.
String options use their exact text as both label and value. Conditions compare
against values, not labels. Operators are `equals`, `not_equals`, `includes`,
`not_includes`, `answered` and `not_answered`. Comparison operators require a
string `value`; scale comparisons use strings such as `"4"`. `parentQuestionId`
is metadata, not automatic branching: use `showIf` to control visibility.
Negative conditions can be true before the referenced question is answered;
combine with `answered` if the follow-up should only appear after an answer.

See [the structured example](../examples/questions.json) for choices, sections,
a scale, an optional question and a conditional follow-up.

## Generate and validate

Run these commands inside `interview-form/`:

```bash
# Validate a supplied question file without changing the active form.
npm run questionnaire:import -- examples/questions.md --check

# Generate a separate definition for review.
npm run questionnaire:import -- examples/questions.json --output /tmp/review-form.json

# Verify the frozen legacy definition.
npm run questionnaire:import -- src/config/questions.json --check
```

The importer never writes the frozen V1/V2 configuration. It validates input or
writes an explicit review artifact supplied with `--output`.
Unsupported fields/types, duplicate IDs/options, forward references, invalid
section order, invalid scales and impossible selection/text limits are rejected.
Without an explicit version it generates a repeatable content-based version:
unchanged content has the same version, and changed content gets another one.
An explicit version is accepted, but reusing the current version for changed
content is rejected. The database publisher also rejects changing an already
published definition under the same version.

Generated IDs depend on question position. Explicit stable, version-prefixed IDs
are required before a future version is activated. Keep source files under
version control. Activation requires an additive registry, publisher, session
route, and storage path; never replace a published V1/V2 definition. No runtime
AI service is involved.

## Prepare the final form

For each future question set, the assistant should:

1. Normalize the supplied questions and preserve the research intent. Use the
   existing defaults where no further information is supplied. State substantive
   assumptions about question type, grouping or required status.
2. Import and inspect the compiled definition, including both sides of branches.
   Review welcome, duration and consent copy for consistency with the new set.
3. Run lint, type checks, relevant unit tests and a production build. Use the
   browser to verify navigation, required/optional answers, review and submission.
   Update thesis-specific browser fixtures if the questions have changed.
4. Publish the matching version to the intended Supabase environment when that
   environment/action is authorized, then rebuild/deploy the hosted application
   when deployment is authorized. Local preview alone does not persist a new
   questionnaire to Supabase.
5. Deliver the working form or reviewable local result, its configuration and
   verification results. Identify any missing hosting or study details precisely.

V2 publishing uses the existing environment in `.env.local`:

```bash
npm run questionnaire:publish
npm run dev
```

The local Supabase stack must already be configured; see the main README for
first-time setup. A participant session can only connect to a published version.
Existing sessions retain their original questionnaire. Do not relabel collected
responses as answers to revised questions.
