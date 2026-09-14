import { z } from "zod";

import type { InterviewConfig } from "@/types/interview";

/**
 * Runtime boundary check for questionnaire configuration. Mirrors
 * src/types/interview.ts and adds cross-reference checks (unique ids,
 * known sections, conditions that only point backwards) that the type
 * system cannot express.
 */

const optionSchema = z.strictObject({
  value: z.string().min(1),
  label: z.string().min(1),
});

const optionsSchema = z.array(optionSchema).min(2);

const conditionSchema = z.strictObject({
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

const optionalProbeSchema = z.strictObject({
  prompt: z.string().min(1),
  showIf: z.array(conditionSchema).optional(),
  requireSubstantiveAnswer: z.boolean().optional(),
});

const researchMetadataSchema = z.strictObject({
  researchQuestions: z.array(z.string()).optional(),
  probes: z.array(z.string()).optional(),
});

const selectionValidationSchema = z.strictObject({
  minSelections: z.number().int().nonnegative().optional(),
  maxSelections: z.number().int().positive().optional(),
});

const textValidationSchema = z.strictObject({
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
});

const baseSchema = z.strictObject({
  id: z.string().min(1),
  construct: z.string().min(1),
  sectionId: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  transition: z.string().optional(),
  description: z.string().optional(),
  aside: z.string().optional(),
  required: z.boolean(),
  constructs: z.array(z.string().min(1)).min(1).optional(),
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
  baseSchema.extend({
    responseType: z.literal("guided_open"),
    nonAnswerOptions: z.array(optionSchema).min(1).optional(),
    optionalProbe: optionalProbeSchema.optional(),
    validation: textValidationSchema.optional(),
  }),
  baseSchema.extend({
    responseType: z.literal("multi_select_with_elaboration"),
    options: optionsSchema,
    allowOther: z.boolean().optional(),
    elaborationPrompt: z.string().min(1),
    elaborationRequired: z.boolean().optional(),
    validation: selectionValidationSchema.optional(),
  }),
]);

const sectionSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  intro: z.string().optional(),
  estimatedMinutes: z.number().positive().optional(),
});

export const interviewConfigSchema = z
  .object({
    version: z.string().min(1),
    experience: z.enum(["standard", "journey"]).optional(),
    sections: z.array(sectionSchema).min(1),
    questions: z.array(questionSchema).min(1),
  })
  .superRefine((config, ctx) => {
    const sectionIds = new Set(config.sections.map((s) => s.id));
    const seenQuestionIds = new Set<string>();
    const positions = new Map(
      config.sections.map((section, index) => [section.id, index])
    );
    if (sectionIds.size !== config.sections.length) {
      ctx.addIssue({
        code: "custom",
        path: ["sections"],
        message: "Section ids must be unique",
      });
    }
    let previousSection = -1;

    config.questions.forEach((question, index) => {
      const path = ["questions", index];

      const sectionPosition = positions.get(question.sectionId) ?? -1;
      if (sectionPosition < previousSection) {
        ctx.addIssue({
          code: "custom",
          path: [...path, "sectionId"],
          message:
            "Questions must follow section order so conditions reference earlier displayed questions",
        });
      }
      previousSection = Math.max(previousSection, sectionPosition);

      if ("options" in question) {
        const values = question.options.map((option) => option.value);
        if (
          new Set(values).size !== values.length ||
          values.includes("__other__")
        ) {
          ctx.addIssue({
            code: "custom",
            path: [...path, "options"],
            message:
              "Option values must be unique and cannot use the reserved __other__ value",
          });
        }
      }
      if ("validation" in question && question.validation) {
        const rules = question.validation;
        if (
          "minLength" in rules &&
          "maxLength" in rules &&
          rules.minLength !== undefined &&
          rules.maxLength !== undefined &&
          rules.minLength > rules.maxLength
        ) {
          ctx.addIssue({
            code: "custom",
            path: [...path, "validation"],
            message: "Minimum length cannot exceed maximum length",
          });
        }
      }
      if (
        question.responseType === "multi_select" ||
        question.responseType === "multi_select_with_elaboration"
      ) {
        const min =
          question.validation?.minSelections ?? (question.required ? 1 : 0);
        const available =
          question.options.length + (question.allowOther ? 1 : 0);
        const max = question.validation?.maxSelections ?? available;
        if (min > max || min > available) {
          ctx.addIssue({
            code: "custom",
            path: [...path, "validation"],
            message:
              "Selection limits cannot be satisfied by the available options",
          });
        }
      }

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
        if (
          !["answered", "not_answered"].includes(condition.operator) &&
          condition.value === undefined
        ) {
          ctx.addIssue({
            code: "custom",
            path: [...path, "showIf", conditionIndex, "value"],
            message: "This condition operator needs a comparison value",
          });
        }
        if (!seenQuestionIds.has(condition.questionId)) {
          ctx.addIssue({
            code: "custom",
            path: [...path, "showIf", conditionIndex, "questionId"],
            message: `Condition on "${condition.questionId}" must reference an earlier question`,
          });
        }
      });

      if (question.responseType === "guided_open") {
        question.optionalProbe?.showIf?.forEach((condition, conditionIndex) => {
          if (
            !["answered", "not_answered"].includes(condition.operator) &&
            condition.value === undefined
          ) {
            ctx.addIssue({
              code: "custom",
              path: [
                ...path,
                "optionalProbe",
                "showIf",
                conditionIndex,
                "value",
              ],
              message: "This condition operator needs a comparison value",
            });
          }
          if (!seenQuestionIds.has(condition.questionId)) {
            ctx.addIssue({
              code: "custom",
              path: [
                ...path,
                "optionalProbe",
                "showIf",
                conditionIndex,
                "questionId",
              ],
              message: `Condition on "${condition.questionId}" must reference an earlier question`,
            });
          }
        });
      }

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
