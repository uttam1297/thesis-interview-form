import { parseInterviewConfig } from "@/lib/validation/interview-config";
import type { InterviewConfig } from "@/types/interview";

/**
 * The research instrument. Two layers: a structured participant profile,
 * then the ten core constructs as open-ended questions with occasional
 * structured items. Branching (showIf) adapts wording for participants who
 * do not use AI tools yet, so every construct still gathers evidence.
 *
 * Bump `version` whenever questions change — drafts from an older version
 * are discarded rather than mapped.
 */
const NO_AI_USE = {
  questionId: "profile-ai-frequency",
  operator: "equals",
  value: "never",
} as const;
const SOME_AI_USE = {
  questionId: "profile-ai-frequency",
  operator: "not_equals",
  value: "never",
} as const;

const rawConfig = {
  version: "2.4.0",
  sections: [
    {
      id: "profile",
      label: "About you",
      intro: "A few quick questions about your role and context.",
      estimatedMinutes: 2,
    },
    {
      id: "decisions",
      label: "How decisions happen",
      intro:
        "Now I'd like to understand how a product decision typically develops.",
      estimatedMinutes: 6,
    },
    {
      id: "data-ai",
      label: "Data and AI",
      intro:
        "Next, the data and AI tools you currently rely on, and how far you trust them.",
      estimatedMinutes: 8,
    },
    {
      id: "challenges",
      label: "Challenges and trade-offs",
      intro:
        "Where things get difficult, and how competing options are weighed.",
      estimatedMinutes: 6,
    },
    {
      id: "governance",
      label: "Governance and learning",
      intro:
        "Constraints on using data and AI, and how outcomes feed back into later decisions.",
      estimatedMinutes: 5,
    },
    {
      id: "requirements",
      label: "Better decision support",
      intro:
        "Finally, what a genuinely useful decision-support process would need to provide.",
      estimatedMinutes: 3,
    },
  ],
  questions: [
    /* ---------- Layer 1: participant profile ---------- */
    {
      id: "profile-role",
      construct: "participant_profile",
      sectionId: "profile",
      title: "Current role",
      prompt: "Which best describes your current role?",
      required: true,
      responseType: "single_select",
      allowOther: true,
      options: [
        { value: "product_manager", label: "Product Manager" },
        { value: "product_owner", label: "Product Owner" },
        { value: "product_analyst", label: "Product / Data Analyst" },
        { value: "growth_ops", label: "Growth or Product Operations" },
        { value: "ux_researcher", label: "UX Researcher" },
        {
          value: "ai_analytics_practitioner",
          label: "AI / Analytics Practitioner",
        },
      ],
    },
    {
      id: "profile-experience",
      construct: "participant_profile",
      sectionId: "profile",
      title: "Years of experience",
      prompt: "How many years of relevant experience do you have?",
      required: true,
      responseType: "single_select",
      options: [
        { value: "0-2", label: "Less than 2 years" },
        { value: "2-5", label: "2–5 years" },
        { value: "6-10", label: "6–10 years" },
        { value: "10+", label: "More than 10 years" },
      ],
    },
    {
      id: "profile-industry",
      construct: "participant_profile",
      sectionId: "profile",
      title: "Industry",
      prompt: "Which industry or sector do you mainly work in?",
      required: true,
      responseType: "single_select",
      allowOther: true,
      options: [
        { value: "software_saas", label: "Software / SaaS" },
        { value: "ecommerce_marketplace", label: "E-commerce or marketplace" },
        { value: "fintech_banking", label: "Fintech or banking" },
        { value: "media_entertainment", label: "Media or entertainment" },
        { value: "healthcare", label: "Healthcare" },
        { value: "energy_industrial", label: "Energy or industrial" },
        { value: "consulting_agency", label: "Consulting or agency" },
      ],
    },
    {
      id: "profile-product-type",
      construct: "participant_profile",
      sectionId: "profile",
      title: "Product type",
      prompt: "What type of digital product or platform do you work on?",
      description: "Choose all that apply.",
      required: true,
      responseType: "multi_select",
      allowOther: true,
      options: [
        { value: "b2b_saas", label: "B2B SaaS" },
        { value: "b2c_app", label: "Consumer app or website" },
        { value: "marketplace", label: "Two-sided marketplace" },
        { value: "internal_platform", label: "Internal platform or tooling" },
        { value: "data_ai_product", label: "Data or AI product" },
      ],
    },
    {
      id: "profile-data-frequency",
      construct: "participant_profile",
      sectionId: "profile",
      title: "Data use frequency",
      prompt:
        "How often do you use data or analytics when making product decisions?",
      required: true,
      responseType: "single_select",
      options: [
        { value: "rarely", label: "Rarely" },
        { value: "sometimes", label: "Sometimes" },
        { value: "most_decisions", label: "For most decisions" },
        { value: "always", label: "For nearly every decision" },
      ],
    },
    {
      id: "profile-ai-frequency",
      construct: "participant_profile",
      sectionId: "profile",
      title: "AI-tool use frequency",
      prompt:
        "How often do you use AI-based tools in your product-related work?",
      required: true,
      responseType: "single_select",
      options: [
        { value: "never", label: "Not yet" },
        { value: "occasionally", label: "Occasionally" },
        { value: "weekly", label: "Weekly" },
        { value: "daily", label: "Daily" },
      ],
    },

    /* ---------- Layer 2: core constructs ---------- */

    // 1. Decision process
    {
      id: "decision-process",
      construct: "decision_process",
      sectionId: "decisions",
      title: "Decision process",
      prompt:
        "Think of a recent product decision you were involved in. How did it develop from the initial problem or signal to the final action?",
      aside:
        "Pick one real decision and walk through it. A specific story tells me more than a general description of the process.",
      required: true,
      responseType: "voice_or_text",
      researchMetadata: {
        researchQuestions: ["RQ1"],
        probes: [
          "Who was involved?",
          "Who had final responsibility?",
          "What happened when people disagreed?",
        ],
      },
    },
    {
      id: "decision-process-elaboration",
      construct: "decision_process",
      sectionId: "decisions",
      title: "Decision process — example",
      prompt:
        "Is there anything that made this particular decision easier or harder than usual?",
      // Required from 2.3.0: what makes a decision unusually hard is where
      // the useful evidence sits, and it was being skipped.
      aside:
        "Anything unusual counts: a disagreement, a deadline, missing data, someone changing their mind.",
      required: true,
      responseType: "voice_or_text",
    },

    // 2. Current data, tools and evidence
    {
      id: "evidence-types",
      construct: "current_evidence",
      sectionId: "decisions",
      title: "Types of evidence used",
      prompt:
        "Which types of evidence do you typically draw on when making product decisions?",
      description: "Choose all that apply.",
      required: true,
      responseType: "multi_select",
      allowOther: true,
      options: [
        { value: "product_analytics", label: "Product usage analytics" },
        { value: "experiments", label: "A/B tests or experiments" },
        { value: "user_research", label: "User interviews or research" },
        {
          value: "customer_feedback",
          label: "Customer feedback or support data",
        },
        { value: "business_metrics", label: "Revenue or business metrics" },
        {
          value: "stakeholder_input",
          label: "Stakeholder or leadership input",
        },
        { value: "competitor_market", label: "Competitor or market analysis" },
      ],
    },
    {
      id: "evidence-influence",
      construct: "current_evidence",
      sectionId: "decisions",
      title: "How evidence influences decisions",
      prompt:
        "How do these data, tools and other forms of evidence actually influence the decision in practice?",
      aside:
        "I am after what actually moves a decision, not what is supposed to.",
      required: true,
      responseType: "voice_or_text",
      researchMetadata: { researchQuestions: ["RQ1"] },
    },

    // 3. Current AI use (branched)
    {
      id: "ai-use-current",
      construct: "current_ai_use",
      sectionId: "data-ai",
      title: "Current AI use",
      prompt:
        "Where do AI-based tools currently support your product decision-making?",
      aside:
        "Anything counts, including tools you use informally or that are not officially sanctioned.",
      required: true,
      responseType: "voice_or_text",
      showIf: [SOME_AI_USE],
      researchMetadata: {
        researchQuestions: ["RQ2"],
        probes: [
          "Was the AI output used directly, or reinterpreted by someone?",
        ],
      },
    },
    {
      id: "ai-use-none",
      construct: "current_ai_use",
      sectionId: "data-ai",
      title: "Reasons for not using AI yet",
      prompt:
        "You mentioned you don't use AI-based tools yet. What has kept them out of your product decision-making so far?",
      aside:
        "There is no wrong answer here. Not using AI is a finding in itself.",
      required: true,
      responseType: "voice_or_text",
      showIf: [NO_AI_USE],
      researchMetadata: { researchQuestions: ["RQ2", "RQ3"] },
    },

    // 4. Data quality and reliability
    {
      id: "data-confidence",
      construct: "data_quality",
      sectionId: "data-ai",
      title: "Availability of good data",
      prompt:
        "How often do you have the data you need, at the quality you need, when a decision has to be made?",
      required: true,
      responseType: "likert_scale",
      min: 1,
      max: 5,
      minLabel: "Rarely",
      maxLabel: "Almost always",
    },
    {
      id: "data-quality",
      construct: "data_quality",
      sectionId: "data-ai",
      title: "Judging data reliability",
      prompt:
        "When the data is thin or you doubt it, how do you decide whether to act on it anyway?",
      aside:
        "Everyone acts on imperfect data sometimes. I am interested in how you draw that line.",
      required: true,
      responseType: "voice_or_text",
      researchMetadata: {
        researchQuestions: ["RQ3"],
        probes: ["What happens when the data is uncertain or conflicting?"],
      },
    },

    // 6. AI trust and validation (branched; placed with Data and AI)
    {
      id: "ai-trust",
      construct: "ai_trust_validation",
      sectionId: "data-ai",
      title: "Trusting AI output",
      prompt:
        "When an AI tool produces an insight, explanation or recommendation, how do you decide whether to trust, verify or challenge it?",
      aside:
        "Think about the last time you took an AI output at face value, and the last time you did not.",
      required: true,
      responseType: "voice_or_text",
      showIf: [SOME_AI_USE],
      researchMetadata: { researchQuestions: ["RQ3", "RQ4"] },
    },
    {
      id: "ai-trust-hypothetical",
      construct: "ai_trust_validation",
      sectionId: "data-ai",
      title: "Trusting AI output (hypothetical)",
      prompt:
        "If an AI tool were introduced to recommend product decisions, what would it take for you to trust, verify or challenge its recommendations?",
      aside:
        "Answer from what you would need, not from what a tool currently offers.",
      required: true,
      responseType: "voice_or_text",
      showIf: [NO_AI_USE],
      researchMetadata: { researchQuestions: ["RQ3", "RQ4"] },
    },

    // 5. Data-to-decision problems and consequences
    {
      id: "data-to-decision-problems",
      construct: "data_to_decision_problems",
      sectionId: "challenges",
      title: "Data-to-decision difficulties",
      prompt:
        "What are the main difficulties in moving from data or analytical insights to an actual product decision, and what consequences do they have?",
      aside:
        "Concrete consequences are useful: delays, wrong calls, decisions quietly not made.",
      required: true,
      responseType: "voice_or_text",
      researchMetadata: {
        researchQuestions: ["RQ3"],
        probes: ["Can you give a concrete example?", "What was missing?"],
      },
    },

    // 7. Prioritisation and trade-offs
    {
      id: "prioritisation-factors",
      construct: "prioritisation",
      sectionId: "challenges",
      title: "Prioritisation factors",
      // Changed in 2.2.0 from a forced ranking of all five factors to a
      // simple choice of the few that dominate. Ranking asked participants
      // to express relative weights they do not hold that precisely, and
      // the open question that follows is where the reasoning is captured.
      prompt:
        "Which of these carry the most weight when your team decides what to work on next?",
      description: "Choose up to three.",
      required: true,
      responseType: "multi_select",
      validation: { minSelections: 1, maxSelections: 3 },
      options: [
        { value: "quantitative_impact", label: "Expected quantitative impact" },
        { value: "user_evidence", label: "Strength of user evidence" },
        {
          value: "strategic_fit",
          label: "Strategic fit or leadership priority",
        },
        { value: "effort_cost", label: "Effort and cost" },
        { value: "risk", label: "Risk or uncertainty" },
      ],
    },
    {
      id: "prioritisation-process",
      construct: "prioritisation",
      sectionId: "challenges",
      title: "How trade-offs are made",
      prompt:
        "When several possible actions or opportunities exist, how are they compared and prioritised?",
      aside: "Including the parts that are not written down anywhere.",
      required: true,
      responseType: "voice_or_text",
      researchMetadata: { researchQuestions: ["RQ1", "RQ4"] },
    },

    // 8. Governance, responsibility, privacy and risk
    {
      id: "governance-constraints",
      construct: "governance_risk",
      sectionId: "governance",
      title: "Governance constraints",
      prompt:
        "What organisational, governance, privacy, security, compliance or responsibility constraints affect how data and AI can be used in product decisions?",
      aside: "Formal rules and informal ones both count.",
      required: true,
      responseType: "voice_or_text",
      researchMetadata: { researchQuestions: ["RQ3", "RQ4"] },
    },

    // 9. Outcome measurement and learning
    {
      id: "outcome-measurement",
      construct: "outcome_learning",
      sectionId: "governance",
      title: "Measuring outcomes",
      prompt:
        "After a decision is implemented, how do you assess whether it produced the expected result, and how is that learning used in later decisions?",
      aside: "If outcomes often go unmeasured, that is worth saying plainly.",
      required: true,
      responseType: "voice_or_text",
      researchMetadata: {
        researchQuestions: ["RQ1", "RQ4"],
        probes: ["What happened after that decision?"],
      },
    },

    // 10. Requirements for better decision support
    {
      id: "decision-support-requirements",
      construct: "decision_support_requirements",
      sectionId: "requirements",
      title: "Requirements for decision support",
      prompt:
        "What would a useful decision-support process need to provide to help you make better-supported product decisions using data and AI?",
      aside:
        "Describe what would help you, not what you think is technically realistic.",
      required: true,
      responseType: "voice_or_text",
      researchMetadata: { researchQuestions: ["RQ4"] },
    },
    {
      id: "decision-support-avoid",
      construct: "decision_support_requirements",
      sectionId: "requirements",
      title: "What it should avoid",
      prompt:
        "Is there anything such a process should specifically avoid doing?",
      aside: "Failure modes you have already seen are especially useful.",
      required: false,
      responseType: "optional_elaboration",
      parentQuestionId: "decision-support-requirements",
    },
    {
      id: "closing-remarks",
      construct: "closing",
      sectionId: "requirements",
      title: "Anything else",
      prompt:
        "Is there anything important about data, AI or product decision-making that we haven't covered?",
      aside: "Anything I did not ask about but should have.",
      required: false,
      responseType: "optional_elaboration",
    },
  ],
} satisfies InterviewConfig;

export const interviewConfig: InterviewConfig = parseInterviewConfig(rawConfig);
