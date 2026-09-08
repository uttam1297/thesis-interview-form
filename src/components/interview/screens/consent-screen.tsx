"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

import { NavigationControls } from "@/components/interview/navigation-controls";
import { ScreenHeading } from "@/components/interview/screen-heading";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { consentContent } from "@/features/consent/content";
import { useInterview } from "@/features/interview/use-interview";
import { sectionVariants, transitions } from "@/lib/motion";

export function ConsentScreen() {
  const { dispatch, state } = useInterview();
  const [agreed, setAgreed] = useState(state.consent?.accepted ?? false);
  const checkboxId = useId();

  return (
    <motion.div
      variants={sectionVariants}
      initial="enter"
      animate="center"
      transition={transitions.base}
      className="flex w-full max-w-(--width-content-narrow) flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <ScreenHeading>{consentContent.title}</ScreenHeading>
        <p className="text-sm text-muted-foreground">{consentContent.intro}</p>
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
          <span className="text-sm">{consentContent.agreementLabel}</span>
        </Field>
      </FieldLabel>

      <NavigationControls
        onBack={() => dispatch({ type: "BACK" })}
        continueDisabled={!agreed}
        onContinue={() =>
          dispatch({
            type: "ACCEPT_CONSENT",
            consentVersion: consentContent.version,
          })
        }
      />
    </motion.div>
  );
}
