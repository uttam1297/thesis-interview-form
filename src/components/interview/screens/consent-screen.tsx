"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

import { NavigationControls } from "@/components/interview/navigation-controls";
import { ScreenHeading } from "@/components/interview/screen-heading";
import { AnonymityGraphic } from "@/components/layout/anonymity-graphic";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { consentContent } from "@/features/consent/content";
import { useInterview } from "@/features/interview/use-interview";
import { transitions } from "@/lib/motion";

export function ConsentScreen() {
  const { dispatch, state } = useInterview();
  const [agreed, setAgreed] = useState(state.consent?.accepted ?? false);
  // Recorded separately from participation, and never inferred from it.
  const [voiceAgreed, setVoiceAgreed] = useState(
    state.consent?.recordingConsent ?? false
  );
  const checkboxId = useId();
  const voiceCheckboxId = useId();

  return (
    <div className="grid w-full justify-items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:justify-items-stretch lg:gap-14">
      <div className="flex w-full max-w-(--width-content-narrow) flex-col gap-6">
        <div className="flex flex-col gap-2">
          <ScreenHeading>{consentContent.title}</ScreenHeading>
          <p className="text-muted-foreground">{consentContent.intro}</p>
        </div>

        <dl className="flex flex-col gap-4">
          {consentContent.points.map((point) => (
            <div key={point.title} className="flex flex-col gap-0.5">
              <dt className="text-sm font-medium">{point.title}</dt>
              <dd className="text-sm text-muted-foreground">
                {point.description}
              </dd>
            </div>
          ))}
        </dl>

        <FieldLabel htmlFor={checkboxId}>
          <Field orientation="horizontal">
            <Checkbox
              id={checkboxId}
              checked={agreed}
              onCheckedChange={setAgreed}
            />
            <span className="flex-1 text-sm">
              {consentContent.agreementLabel}
            </span>

            {/* Small, and only on agreeing: a quiet acknowledgement rather
                than a celebration of a legal step. */}
            <AnimatePresence initial={false}>
              {agreed && (
                <motion.span
                  key="agreed"
                  aria-hidden="true"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 520,
                    damping: 26,
                    mass: 0.6,
                  }}
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-htw)]"
                >
                  <Check className="size-3 text-white" strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </Field>
        </FieldLabel>

        <FieldLabel htmlFor={voiceCheckboxId}>
          <Field orientation="horizontal">
            <Checkbox
              id={voiceCheckboxId}
              checked={voiceAgreed}
              onCheckedChange={setVoiceAgreed}
            />
            <span className="flex-1 text-sm">
              {consentContent.voiceConsentLabel}
            </span>

            <AnimatePresence initial={false}>
              {voiceAgreed && (
                <motion.span
                  key="voice-agreed"
                  aria-hidden="true"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 520,
                    damping: 26,
                    mass: 0.6,
                  }}
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-htw)]"
                >
                  <Check className="size-3 text-white" strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </Field>
        </FieldLabel>

        <p className="text-xs text-muted-foreground">
          {consentContent.legalBasis}
        </p>

        <NavigationControls
          onBack={() => dispatch({ type: "BACK" })}
          continueDisabled={!agreed}
          onContinue={() =>
            dispatch({
              type: "ACCEPT_CONSENT",
              consentVersion: consentContent.version,
              recordingConsent: voiceAgreed,
            })
          }
        />
      </div>

      {/* Below the fold on small screens: consent should be readable and
          actionable without scrolling past a picture. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.emphasized}
        className="order-last hidden w-full lg:order-none lg:block lg:w-auto"
      >
        <div className="rounded-2xl border bg-card p-8 shadow-(--shadow-subtle)">
          <AnonymityGraphic className="h-56 w-72 text-foreground" />
          <p className="mt-4 max-w-72 text-sm text-muted-foreground">
            What you tell me is stored under a code. Your name and company never
            enter the dataset.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
