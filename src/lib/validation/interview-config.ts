import { z } from "zod";

import type { InterviewConfig } from "@/types/interview";

/**
 * Runtime boundary check for questionnaire configuration. Mirrors
 * src/types/interview.ts and adds cross-reference checks (unique ids,
 * known sections, conditions that only point backwards) that the type
 * system cannot express.
 */

const optionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const optionsSchema = z.array(optionSchema).min(2);

const conditionSchema = z.object({
  questionId: z.string().min(1),
  operator: z.enum([
    "equals",
    "not_equals",
    "includes",
    "not_includes",
    "answered",
    "not_answered",
  ]),
  value: z.string().optional(),
});

const researchMetadataSchema = z.object({
  researchQuestions: z.array(z.string()).optional(),
  probes: z.array(z.string()).optional(),
});

const selectionValidationSchema = z.object({
  minSelections: z.number().int().nonnegative().optional(),
  maxSelections: z.number().int().positive().optional(),
});

const textValidationSchema = z.object({
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
});

const baseSchema = z.object({
  id: z.string().min(1),
  construct: z.string().min(1),
  sectionId: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean(),
  showIf: z.array(conditionSchema).optional(),
  researchMetadata: researchMetadataSchema.optional(),
});

const questionSchema = z.discriminatedUnion("responseType", [
  baseSchema.extend({
    responseType: z.literal("single_select"),
    options: optionsSchema,
    allowOther: z.boolean().optional(),
  }),
  baseSchema.extend({
    responseType: z.literal("multi_select"),
    options: optionsSchema,
    allowOther: z.boolean().optional(),
    validation: selectionValidationSchema.optional(),
  }),
  baseSchema.extend({
    responseType: z.literal("likert_scale"),
    min: z.number().int(),
    max: z.number().int(),
    minLabel: z.string().optional(),
    maxLabel: z.string().optional(),
  }),
  baseSchema.extend({
    responseType: z.literal("ranking"),
    options: optionsSchema,
  }),
  baseSchema.extend({
    responseType: z.literal("short_text"),
    validation: textValidationSchema.optional(),
  }),
  baseSchema.extend({
    responseType: z.literal("long_text"),
    validation: textValidationSchema.optional(),
  }),
  baseSchema.extend({
    responseType: z.literal("voice_or_text"),
    validation: textValidationSchema.optional(),
  }),
  baseSchema.extend({
    responseType: z.literal("optional_elaboration"),
    required: z.literal(false),
    parentQuestionId: z.string().optional(),
    validation: textValidationSchema.optional(),
  }),
]);

const sectionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  intro: z.string().optional(),
  estimatedMinutes: z.number().positive().optional(),
});

export const interviewConfigSchema = z
  .object({
    version: z.string().min(1),
    sections: z.array(sectionSchema).min(1),
    questions: z.array(questionSchema).min(1),
  })
  .superRefine((config, ctx) => {
    const sectionIds = new Set(config.sections.map((s) => s.id));
    const seenQuestionIds = new Set<string>();

    config.questions.forEach((question, index) => {
      const path = ["questions", index];

      if (seenQuestionIds.has(question.id)) {
        ctx.addIssue({
          code: "custom",
          path: [...path, "id"],
          message: `Duplicate question id "${question.id}"`,
        });
      }

      if (!sectionIds.has(question.sectionId)) {
        ctx.addIssue({
          code: "custom",
          path: [...path, "sectionId"],
          message: `Unknown section "${question.sectionId}"`,
        });
      }

      if (
        question.responseType === "likert_scale" &&
        question.max <= question.min
      ) {
        ctx.addIssue({
          code: "custom",
          path: [...path, "max"],
          message: "Scale max must be greater than min",
        });
      }

      question.showIf?.forEach((condition, conditionIndex) => {
        if (!seenQuestionIds.has(condition.questionId)) {
          ctx.addIssue({
            code: "custom",
            path: [...path, "showIf", conditionIndex, "questionId"],
            message: `Condition on "${condition.questionId}" must reference an earlier question`,
          });
        }
      });

      if (
        question.responseType === "optional_elaboration" &&
        question.parentQuestionId &&
        !seenQuestionIds.has(question.parentQuestionId)
      ) {
        ctx.addIssue({
          code: "custom",
          path: [...path, "parentQuestionId"],
          message: `Parent "${question.parentQuestionId}" must be an earlier question`,
        });
      }

      seenQuestionIds.add(question.id);
    });
  });

export function parseInterviewConfig(input: unknown): InterviewConfig {
  return interviewConfigSchema.parse(input);
}
