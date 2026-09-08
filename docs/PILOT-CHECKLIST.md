# Pilot checklist

For a pilot with 2–3 participants before real data collection begins. The point
is to find confusing wording and friction while it is still cheap to fix.

## Before the pilot

- [ ] Consent text in `src/features/consent/content.ts` replaced with the
      university-approved wording (retention, withdrawal, supervisor contact).
- [ ] Contact address in `src/config/study.ts` is the one participants should
      actually use for questions and withdrawal requests.
- [ ] Questionnaire published: `npm run questionnaire:publish`.
- [ ] Version number noted here, so pilot responses can be told apart from real
      ones later: `__________`
- [ ] Decide whether pilot responses will be kept or deleted before the study.
- [ ] Full test suite green (`lint`, `typecheck`, `test`, `test:integration`,
      `test:e2e`, `build`).
- [ ] Walked the flow once yourself on a phone.

## During each pilot session

Ask the participant to think aloud. Do not explain the interface — where they
hesitate is the finding. Record answers immediately afterwards.

### 1. Consent

- Did they understand what they were agreeing to, in their own words?
- Did they notice participation and recording are separate?
- Anything they expected to be told and were not?

### 2. Progress and orientation

- Did they know roughly how far along they were?
- Did the section transitions help, or feel like an interruption?
- Did anyone ask "how much longer?" — and at which point?

### 3. Question clarity

For each question that caused a pause, note the question id and what confused
them. Wording is research content: collect the evidence, then decide
deliberately whether to change it.

- Which questions were re-read?
- Which were answered with a clarifying question back to you?
- Did any question feel repetitive after an earlier one?

### 4. Voice versus typing

- Did they notice that speaking was an option?
- Did they try it? If not, why not?
- If they did: was the transcript accurate enough to edit rather than redo?
- Did anyone feel obliged to speak when they preferred typing?

### 5. Optional versus required

- Did anything feel mandatory that is actually optional?
- Did they notice "Skip for now"?
- Did they skip anything, and did they say why?

### 6. Effort and length

- Completion time (from the `/admin/pilot` view): `______ minutes`
- Did they ever want to stop? Where?
- Did open questions feel like they demanded an essay?

### 7. Structured answers

- Were the options for role, industry and product type sufficient?
- How often was "Other" used, and what did they type?
- Was the ranking question understood without explanation?

### 8. Reliability

- Did they lose any work at any point?
- Did the save indicator reassure them, or go unnoticed?
- If they left and came back, did resuming work?

## After the pilot

Open `/admin/pilot` for the measured signals:

- **Completion time** — median, fastest, slowest. Only after this do you have
  grounds to quote a duration to real participants. Update the welcome screen
  estimate in `src/components/interview/screens/welcome-screen.tsx` from these
  numbers rather than a guess.
- **Question health** — skip counts and where unfinished sessions stopped. A
  question skipped by most participants is either badly worded or genuinely not
  applicable; decide which.

Then review the exports (`/api/admin/export?format=long`) and ask the question
that matters most:

- [ ] **Did the answers generate the evidence the research questions need?**
      Map a sample of responses to RQ1–RQ4. If a construct produced only thin
      or generic answers, the question needs rethinking before the real study,
      not after.

## Deciding on changes

| Finding                                   | Action                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| Confusing supporting copy, labels, errors | Fix directly; no version bump needed for wording outside questions                        |
| A research question is misread            | Change deliberately, bump the questionnaire version, note it in the thesis method section |
| Missing structured option                 | Add it, bump the version                                                                  |
| Technical fault                           | Fix and add a regression test                                                             |

Bump the version for any change to question content, so pilot and study data
never get conflated:

1. Edit `src/config/interview.ts`, bump `version`.
2. `npm run questionnaire:publish`.
