import { z } from "zod";

/**
 * Zod mirror of src/types/interview.ts. This is the runtime boundary check
 * for question configuration — it validates config data going in, rather
 * than being trusted purely at the TypeScript (compile-time) level.
 */

const questionOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const questionBaseSchema = z.object({
  id: z.string().min(1),
  construct: z.string().min(1),
  section: z.string().min(1),
  title: z.string().min(1),
  question: z.string().min(1),
  required: z.boolean(),
  voiceEnabled: z.boolean().optional(),
});

export const singleSelectQuestionSchema = questionBaseSchema.extend({
  type: z.literal("single_select"),
  options: z.array(questionOptionSchema).min(2),
});

export const multiSelectQuestionSchema = questionBaseSchema.extend({
  type: z.literal("multi_select"),
  options: z.array(questionOptionSchema).min(2),
});

export const scaleQuestionSchema = questionBaseSchema.extend({
  type: z.literal("scale"),
  min: z.number().int(),
  max: z.number().int(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
});

export const shortTextQuestionSchema = questionBaseSchema.extend({
  type: z.literal("short_text"),
});

export const longTextQuestionSchema = questionBaseSchema.extend({
  type: z.literal("long_text"),
});

export const interviewQuestionSchema = z
  .discriminatedUnion("type", [
    singleSelectQuestionSchema,
    multiSelectQuestionSchema,
    scaleQuestionSchema,
    shortTextQuestionSchema,
    longTextQuestionSchema,
  ])
  .refine((q) => q.type !== "scale" || q.max > q.min, {
    message: "scale max must be greater than min",
    path: ["max"],
  });

export const interviewQuestionListSchema = z.array(interviewQuestionSchema);
