/**
 * Consent screen copy, kept out of the page component so wording/version
 * can change (as ethics review requires) without touching UI code.
 */

export const consentContent = {
  version: "v1-draft",
  title: "Before we begin",
  intro:
    "This research explores how product professionals use data and AI in decision-making. Participation is voluntary.",
  points: [
    {
      title: "Estimated duration",
      description: "About 20–30 minutes, and you can pause at any time.",
    },
    {
      title: "Confidentiality",
      description:
        "Responses are anonymized in the thesis. Your name and company are never published.",
    },
    {
      title: "Pausing and withdrawal",
      description:
        "You can leave and resume later, or withdraw your response before submission.",
    },
    {
      title: "Voice or text",
      description:
        "Open questions can be answered by typing or speaking — spoken answers are shown as editable text before you submit.",
    },
  ],
  agreementLabel: "I understand and agree to take part in this research.",
};
