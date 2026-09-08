import { parseInterviewConfig } from "@/lib/validation/interview-config";
import type { InterviewConfig } from "@/types/interview";

/**
 * Small, deterministic questionnaire for engine tests: two sections, one
 * branch on "uses-ai", one optional question, one of each structured type.
 */
export const testConfig: InterviewConfig = parseInterviewConfig({
  version: "test-1",
  sections: [
    { id: "profile", label: "About you", estimatedMinutes: 1 },
    { id: "core", label: "Core", estimatedMinutes: 4 },
  ],
  questions: [
    {
      id: "role",
      construct: "profile",
      sectionId: "profile",
      title: "Role",
      prompt: "What is your role?",
      required: true,
      responseType: "single_select",
      allowOther: true,
      options: [
        { value: "pm", label: "Product Manager" },
        { value: "analyst", label: "Analyst" },
      ],
    },
    {
      id: "uses-ai",
      construct: "profile",
      sectionId: "profile",
      title: "Uses AI",
      prompt: "Do you use AI tools?",
      required: true,
      responseType: "single_select",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
    {
      id: "ai-how",
      construct: "ai_use",
      sectionId: "core",
      title: "How AI is used",
      prompt: "How do AI tools support you?",
      required: true,
      responseType: "voice_or_text",
      showIf: [{ questionId: "uses-ai", operator: "equals", value: "yes" }],
    },
    {
      id: "ai-why-not",
      construct: "ai_use",
      sectionId: "core",
      title: "Why not AI",
      prompt: "What keeps AI tools out of your work?",
      required: true,
      responseType: "voice_or_text",
      showIf: [{ questionId: "uses-ai", operator: "equals", value: "no" }],
    },
    {
      id: "confidence",
      construct: "data_quality",
      sectionId: "core",
      title: "Confidence",
      prompt: "How confident are you in your data?",
      required: true,
      responseType: "likert_scale",
      min: 1,
      max: 5,
    },
    {
      id: "tools",
      construct: "evidence",
      sectionId: "core",
      title: "Tools",
      prompt: "Which tools do you use?",
      required: false,
      responseType: "multi_select",
      options: [
        { value: "sheets", label: "Spreadsheets" },
        { value: "bi", label: "BI tool" },
      ],
    },
    {
      id: "priorities",
      construct: "prioritisation",
      sectionId: "core",
      title: "Priorities",
      prompt: "Rank these.",
      required: true,
      responseType: "ranking",
      options: [
        { value: "impact", label: "Impact" },
        { value: "effort", label: "Effort" },
      ],
    },
    {
      id: "closing",
      construct: "closing",
      sectionId: "core",
      title: "Anything else",
      prompt: "Anything else?",
      required: false,
      responseType: "optional_elaboration",
    },
  ],
});

export const fixedNow = "2026-01-01T00:00:00.000Z";
