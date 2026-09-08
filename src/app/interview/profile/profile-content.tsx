"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { NavigationControls } from "@/components/interview/navigation-controls";
import { ScaleInput } from "@/components/interview/scale-input";
import { SectionHeader } from "@/components/interview/section-header";
import { SingleSelectGroup } from "@/components/interview/single-select-group";
import { requireQuestion } from "@/config/interview";
import { sectionVariants, transitions } from "@/lib/motion";

const roleQuestion = requireQuestion("demo-role", "single_select");
const confidenceQuestion = requireQuestion("demo-confidence", "scale");

export function ProfileContent() {
  const router = useRouter();
  const [role, setRole] = useState<string>();
  const [confidence, setConfidence] = useState<number>();

  const canContinue = role !== undefined && confidence !== undefined;

  return (
    <motion.div
      variants={sectionVariants}
      initial="enter"
      animate="center"
      transition={transitions.base}
      className="flex w-full max-w-(--width-content-narrow) flex-col gap-8"
    >
      <SectionHeader section="About you" />

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{roleQuestion.question}</h2>
        <SingleSelectGroup
          name="demo-role"
          options={roleQuestion.options}
          value={role}
          onValueChange={setRole}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-medium">{confidenceQuestion.question}</h2>
        <ScaleInput
          name="demo-confidence"
          min={confidenceQuestion.min}
          max={confidenceQuestion.max}
          minLabel={confidenceQuestion.minLabel}
          maxLabel={confidenceQuestion.maxLabel}
          value={confidence}
          onValueChange={setConfidence}
        />
      </div>

      <NavigationControls
        onBack={() => router.push("/interview/consent")}
        continueDisabled={!canContinue}
        onContinue={() => router.push("/interview/section-transition")}
      />
    </motion.div>
  );
}
