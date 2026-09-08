/**
 * Identity of the study itself. Kept in configuration rather than in JSX so
 * the title, institution and contact details can be corrected without
 * touching components — the same rule the questionnaire follows.
 */
export const study = {
  title:
    "From Data to Product Decisions: Designing an AI-Assisted Product Analytics Framework for Digital Platforms",
  /** Short form for browser tabs and tight spaces. */
  shortTitle: "From Data to Product Decisions",
  institution: "HTW Berlin — University of Applied Sciences",
  programme: "Master's thesis research",
  contactEmail: "uttamdarekar@proton.me",
  logo: {
    src: "/images/htw-logo.png",
    alt: "HTW Berlin, University of Applied Sciences",
    width: 576,
    height: 344,
  },
} as const;
