"use client";

import {
  Check,
  Clock3,
  Info,
  Mic,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type ComponentType } from "react";

import { NavigationControls } from "@/components/interview/navigation-controls";
import { ScreenHeading } from "@/components/interview/screen-heading";
import { AnonymityGraphic } from "@/components/layout/anonymity-graphic";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { consentContent, type ConsentPoint } from "@/features/consent/content";
import { useInterview } from "@/features/interview/use-interview";
import { transitions } from "@/lib/motion";

const icons: Record<
  ConsentPoint["icon"],
  ComponentType<{ className?: string }>
> = {
  person: User,
  data: ShieldCheck,
  voice: Mic,
  use: Info,
  retention: Clock3,
  withdraw: Trash2,
};

/** The tick shown on an agreed checkbox. */
function AgreedMark() {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      transition={{ type: "spring", stiffness: 520, damping: 26, mass: 0.6 }}
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-htw)]"
    >
      <Check className="size-3 text-white" strokeWidth={3} />
    </motion.span>
  );
}

/**
 * Consent in two layers: a scannable line per point, with the full wording
 * one click away. Everything required is present — the disclosure states
 * the same points more completely rather than hiding anything that matters.
 */
export function ConsentScreen() {
  const { dispatch, state } = useInterview();
  const [agreed, setAgreed] = useState(state.consent?.accepted ?? false);
  // Recorded separately from participation, and never inferred from it.
  const [voiceAgreed, setVoiceAgreed] = useState(
    state.consent?.recordingConsent ?? false
  );
  const [voiceHintOpen, setVoiceHintOpen] = useState(false);
  const checkboxId = useId();
  const voiceCheckboxId = useId();
  const voiceHintId = useId();

  return (
    <div className="grid w-full justify-items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:justify-items-stretch lg:gap-14">
      <div className="flex w-full max-w-(--width-content-narrow) flex-col gap-6">
        <div className="flex flex-col gap-2">
          <ScreenHeading>{consentContent.title}</ScreenHeading>
          <p className="text-muted-foreground">{consentContent.intro}</p>
        </div>

        {/* One line each, so the whole picture is visible at a glance. */}
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {consentContent.points.map((point) => {
            const Icon = icons[point.icon];
            return (
              <li key={point.title} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-[var(--color-htw)]" />
                <span className="text-sm">
                  <span className="font-medium">{point.title}</span>
                  {" — "}
                  <span className="text-muted-foreground">{point.summary}</span>
                </span>
              </li>
            );
          })}
        </ul>

        <details className="group rounded-lg border px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
            <span className="underline underline-offset-4 group-open:no-underline">
              {consentContent.detailsLabel}
            </span>
          </summary>
          <dl className="mt-4 flex flex-col gap-4">
            {consentContent.points.map((point) => (
              <div key={point.title} className="flex flex-col gap-0.5">
                <dt className="text-sm font-medium">{point.title}</dt>
                <dd className="text-sm text-muted-foreground">
                  {point.detail}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            {consentContent.legalBasis}
          </p>
        </details>

        <div className="flex flex-col gap-3">
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
              <AnimatePresence initial={false}>
                {agreed && <AgreedMark key="agreed" />}
              </AnimatePresence>
            </Field>
          </FieldLabel>

          <div className="flex flex-col gap-2">
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
                  {voiceAgreed && <AgreedMark key="voice-agreed" />}
                </AnimatePresence>
              </Field>
            </FieldLabel>

            {/* Without this, the checkbox reads as one more permission to
                grant rather than an offer that saves typing. */}
            <div className="flex flex-col gap-2 pl-1">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto w-fit gap-1.5 p-0 text-muted-foreground"
                aria-expanded={voiceHintOpen}
                aria-controls={voiceHintId}
                onClick={() => setVoiceHintOpen((open) => !open)}
              >
                <Info className="size-3.5" aria-hidden="true" />
                {voiceHintOpen ? "Hide" : "What does this do?"}
              </Button>

              <AnimatePresence initial={false}>
                {voiceHintOpen && (
                  <motion.div
                    id={voiceHintId}
                    key="voice-hint"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={transitions.base}
                    className="overflow-hidden"
                  >
                    <div className="relative rounded-lg border bg-muted/40 p-4 pr-9 text-sm text-muted-foreground">
                      <Mic
                        className="mb-2 size-4 text-[var(--color-htw)]"
                        aria-hidden="true"
                      />
                      <p>{consentContent.voiceConsentHint}</p>
                      <button
                        type="button"
                        onClick={() => setVoiceHintOpen(false)}
                        aria-label="Hide explanation"
                        className="absolute top-2.5 right-2.5 rounded-md p-1 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

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
