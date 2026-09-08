/**
 * Consent screen copy, kept out of the page component so wording and version
 * can change (as ethics review requires) without touching UI code. The
 * version string is written to every consent record, so any change to the
 * wording below must come with a bump.
 *
 * Structured around what a GDPR/DSGVO informed-consent notice for academic
 * research is expected to cover: who is responsible, what is collected, why,
 * on what legal basis, how long it is kept, and how to withdraw. Written in
 * plain language — consent obtained through dense text is not informed.
 *
 * NOT YET APPROVED. Confirm the retention period, the legal basis and your
 * supervisor's details with your examiner and HTW's data protection office
 * before inviting real participants.
 */

/**
 * The one place the length of the interview is stated. Both the landing and
 * the consent screen read it, so they cannot drift apart — they previously
 * claimed 25–30 and 20–30 minutes on adjacent screens.
 *
 * Replace with the median measured in the pilot (/admin/pilot).
 */
export const ESTIMATED_MINUTES = "20–30 minutes";

/** Months after which collected responses are deleted. */
export const RETENTION_MONTHS = 5;

export const consentContent = {
  version: "v2-2026-09",
  title: "Before we begin",
  intro:
    "I am researching how professionals use data and AI when they make product decisions. This is a master's thesis at HTW Berlin. Taking part is voluntary, and stopping early costs you nothing.",

  points: [
    {
      title: "Who is responsible",
      description:
        "Uttam Darekar, MBA & Engineering student at HTW Berlin — University of Applied Sciences. I am the only person who sees your raw answers. Reach me at Uttam.Darekar@Student.HTW-Berlin.de.",
    },
    {
      title: "What is collected",
      description:
        "Your answers, plus your role, years of experience, industry and product type. No name, no email address, no company name. Your answers are stored under a code such as P014.",
    },
    {
      title: "Speaking instead of typing",
      description:
        "Open questions can be answered by speaking. Your browser converts speech to text on your device; only the text reaches me, and you can edit it before continuing. No audio is recorded or stored by this form.",
    },
    {
      title: "How it is used",
      description:
        "Anonymised answers and short quotations may appear in the thesis and in work arising from it. Nothing identifying you or your employer is published, and your answers are not sent to any AI service.",
    },
    {
      title: `How long it is kept (${RETENTION_MONTHS} months)`,
      description: `Responses are deleted within ${RETENTION_MONTHS} months of collection, once the thesis has been assessed. Anonymised extracts already published cannot be recalled.`,
    },
    {
      title: "Pausing and withdrawing",
      description:
        "You can pause and return later. After submitting, email me your participant code and I will delete your responses — no reason needed, and no disadvantage to you.",
    },
  ],

  /** Participation consent: required to proceed. */
  agreementLabel:
    "I have read the above and agree to take part in this research.",

  /**
   * Speaking is a separate decision from taking part, so it is asked
   * separately and never inferred from the agreement above.
   */
  voiceConsentLabel:
    "I also agree that my browser may convert my speech to text when I choose to answer by speaking. Optional — you can always type instead.",

  /** Shown beneath the checkboxes. */
  legalBasis:
    "Legal basis: your consent under Art. 6(1)(a) GDPR, which you may withdraw at any time with effect for the future. Data protection questions can also go to HTW Berlin's data protection officer at datenschutz@htw-berlin.de.",
};
