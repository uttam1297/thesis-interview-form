const TOKEN_KEY = "interview:resume-token";
const AUTO_RESUME_KEY = "interview:auto-resume";

/**
 * Holds the participant's resume token for this browser. Losing it only
 * means they need the emailed/copied resume link again; it is never the
 * only copy of their answers, which also live in the local draft and on
 * the server.
 */
export const resumeTokenStore = {
  read(): string | null {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  write(token: string): void {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Private mode with storage disabled: the session still works in
      // this tab, and the resume link is shown to the participant.
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing to do.
    }
  },

  /**
   * One-shot marker set when the participant arrived through a resume link.
   * Following that link is already a deliberate act, so the interview
   * continues without asking again. Session-scoped: a later visit to the
   * site from this device gets the usual choice.
   */
  markAutoResume(): void {
    try {
      window.sessionStorage.setItem(AUTO_RESUME_KEY, "1");
    } catch {
      // Falls back to showing the continue/start-over choice.
    }
  },

  consumeAutoResume(): boolean {
    // Cached for the life of the page: React invokes effects twice in
    // development, and a one-shot read would otherwise be swallowed by the
    // first invocation.
    if (autoResumeForThisPage === null) {
      try {
        autoResumeForThisPage =
          window.sessionStorage.getItem(AUTO_RESUME_KEY) === "1";
        window.sessionStorage.removeItem(AUTO_RESUME_KEY);
      } catch {
        autoResumeForThisPage = false;
      }
    }
    return autoResumeForThisPage;
  },
};

let autoResumeForThisPage: boolean | null = null;
