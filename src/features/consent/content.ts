/**
 * Consent screen copy, kept out of the page component so wording and version
 * can change (as ethics review requires) without touching UI code. The
 * version string is written to every consent record, so any change to the
 * wording below must come with a bump.
 *
 * Laid out in two layers, which is what data protection guidance recommends
 * and what people actually read: a short line per point, always visible,
 * with the full wording one click away. Everything required is present —
 * nothing that matters is hidden behind the disclosure, it is only stated
 * more fully there.
 *
 * NOT YET APPROVED. Confirm the retention period, the legal basis and your
 * supervisor's details with your examiner and HTW's data protection office
 * before inviting real participants.
 */

/**
 * The one place the length of the interview is stated. Both the landing and
 * the consent screen read it, so they cannot drift apart.
 *
 * Replace with the median measured in the pilot (/admin/pilot).
 */
export const ESTIMATED_MINUTES = "20–30 minutes";

/** Months after which collected responses are deleted. */
export const RETENTION_MONTHS = 5;

export interface ConsentPoint {
  /** Icon key, mapped to a lucide icon by the consent screen. */
  icon: "person" | "data" | "voice" | "use" | "retention" | "withdraw";
  title: string;
  /** One line, always visible. */
  summary: string;
  /** The full wording, shown when the participant opens the details. */
  detail: string;
}

export const consentContent = {
  version: "v3-2026-09",
  title: "Before we begin",
  intro: `A master's thesis at HTW Berlin on how professionals use data and AI to make product decisions. ${ESTIMATED_MINUTES}, voluntary, and you can stop whenever you like.`,

  points: [
    {
      icon: "person",
      title: "Just me",
      summary: "One researcher sees your answers.",
      detail:
        "Uttam Darekar, MBA & Engineering student at HTW Berlin — University of Applied Sciences. I am the only person with access to your raw answers. You can reach me at Uttam.Darekar@Student.HTW-Berlin.de.",
    },
    {
      icon: "data",
      title: "No name, no company",
      summary: "Your answers are stored under a code.",
      detail:
        "I collect your answers plus your role, years of experience, industry and product type. No name, no email address, no company name. Everything is stored under a code such as P014.",
    },
    {
      icon: "voice",
      title: "Speak or type",
      summary: "Speech becomes text on your device.",
      detail:
        "Open questions can be answered by speaking. Your browser converts speech to text on your own device; only the text reaches me, and you can edit it before continuing. No audio is recorded or stored by this form.",
    },
    {
      icon: "use",
      title: "Used in the thesis",
      summary: "Anonymised, and never sent to an AI service.",
      detail:
        "Anonymised answers and short quotations may appear in the thesis and in work arising from it. Nothing identifying you or your employer is published, and your answers are not sent to any AI service.",
    },
    {
      icon: "retention",
      title: `Deleted within ${RETENTION_MONTHS} months`,
      summary: "Once the thesis has been assessed.",
      detail: `Responses are deleted within ${RETENTION_MONTHS} months of collection, once the thesis has been assessed. Anonymised extracts already published cannot be recalled.`,
    },
    {
      icon: "withdraw",
      title: "Withdraw any time",
      summary: "Email me your code and it is deleted.",
      detail:
        "You can pause and return later. After submitting, email me your participant code and I will delete your responses — no reason needed, and no disadvantage to you.",
    },
  ] satisfies ConsentPoint[],

  /** Label on the disclosure that reveals the full wording. */
  detailsLabel: "Read the full details",

  /** Participation consent: required to proceed. */
  agreementLabel:
    "I have read the above and agree to take part in this research.",

  /**
   * Speaking is a separate decision from taking part, so it is asked
   * separately and never inferred from the agreement above.
   */
  voiceConsentLabel: "I'd also like the option to speak my answers.",

  /**
   * Why anyone would want this. Without it the checkbox reads as another
   * permission to grant rather than an offer that saves them typing.
   */
  voiceConsentHint:
    "Open questions take the longest to type. Tick this and a “Speak answer” button appears on those questions — your browser turns speech into text on your device, and you can edit it before moving on. You can still type at any point, and you can leave this unticked.",

  /** Shown beneath the checkboxes. */
  legalBasis:
    "Legal basis: your consent under Art. 6(1)(a) GDPR, which you may withdraw at any time with effect for the future. Data protection questions can also go to HTW Berlin's data protection officer at datenschutz@htw-berlin.de.",
};
