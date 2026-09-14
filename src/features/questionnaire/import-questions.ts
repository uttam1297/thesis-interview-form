import { z } from "zod";

import { hashDefinition } from "@/features/questionnaire/definition-hash";
import { parseInterviewConfig } from "@/lib/validation/interview-config";
import type { InterviewConfig } from "@/types/interview";

const nonempty = z.string().trim().min(1);
// Keep supplied fields so the completed configuration can reject misspellings.
const questionInput = z.union([
  nonempty,
  z.object({ prompt: nonempty }).passthrough(),
]);
const sourceSchema = z.union([
  z.array(questionInput).min(1),
  z
    .object({
      version: nonempty.optional(),
      experience: z.enum(["standard", "journey"]).optional(),
      sections: z
        .array(
          z
            .object({
              id: nonempty,
              label: nonempty,
              intro: z.string().optional(),
              estimatedMinutes: z.number().positive().optional(),
            })
            .strict()
        )
        .min(1)
        .optional(),
      questions: z.array(questionInput).min(1),
    })
    .strict(),
]);

/** Node-side authoring boundary; never imported into the browser bundle. */
export function compileQuestions(input: unknown): InterviewConfig {
  const parsed = sourceSchema.parse(input);
  const source = Array.isArray(parsed) ? { questions: parsed } : parsed;
  const sections = source.sections ?? [{ id: "questions", label: "Questions" }];
  const questions = source.questions.map((entry, index) => {
    const question = typeof entry === "string" ? { prompt: entry } : entry;
    const responseType = question.responseType ?? "voice_or_text";
    const sectionId = question.sectionId ?? sections[0].id;
    return {
      ...question,
      id: question.id ?? `q${index + 1}`,
      title: question.title ?? question.prompt,
      construct: question.construct ?? "general",
      sectionId,
      responseType,
      required: question.required ?? responseType !== "optional_elaboration",
      ...(Array.isArray(question.options)
        ? {
            options: question.options.map((option: unknown) =>
              typeof option === "string"
                ? { value: option, label: option }
                : option
            ),
          }
        : {}),
    };
  });

  const config = parseInterviewConfig({
    version: source.version ?? "generated",
    experience: source.experience,
    sections,
    questions,
  });
  // Identical content yields an identical version; changed content gets a
  // fresh version so existing responses retain their original definition.
  if (!source.version)
    config.version = `questions-${hashDefinition(config).slice(0, 16)}`;
  return config;
}

/** One question per nonempty line; Markdown headings create sections. */
export function parseQuestionText(text: string): unknown {
  const sections: Array<{ id: string; label: string }> = [];
  const questions: Array<{ prompt: string; sectionId: string }> = [];
  let currentSection: string | undefined;
  for (const rawLine of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = /^#{1,6}\s+(.+)$/.exec(line);
    if (heading) {
      currentSection = `section-${sections.length + 1}`;
      sections.push({ id: currentSection, label: heading[1].trim() });
      continue;
    }
    if (!currentSection) {
      currentSection = "section-1";
      sections.push({ id: currentSection, label: "Questions" });
    }
    questions.push({
      prompt: line.replace(/^(?:\d+[.)]|[-*+])\s+/, ""),
      sectionId: currentSection,
    });
  }
  return { sections, questions };
}
