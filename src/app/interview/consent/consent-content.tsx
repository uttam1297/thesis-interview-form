"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { NavigationControls } from "@/components/interview/navigation-controls";
import { consentContent } from "@/features/consent/content";
import { sectionVariants, transitions } from "@/lib/motion";

export function ConsentContent() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
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
        <h1 className="text-xl font-medium sm:text-2xl">
          {consentContent.title}
        </h1>
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
        continueDisabled={!agreed}
        onContinue={() => router.push("/interview/profile")}
        continueLabel="Continue"
      />
    </motion.div>
  );
}
