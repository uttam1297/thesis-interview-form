"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MultiSelectGroup } from "@/components/interview/multi-select-group";
import { NavigationControls } from "@/components/interview/navigation-controls";
import { QuestionContainer } from "@/components/interview/question-container";
import { requireQuestion } from "@/config/interview";

const question = requireQuestion("demo-tools", "multi_select");

export function QuestionChoiceContent() {
  const router = useRouter();
  const [values, setValues] = useState<string[]>([]);

  return (
    <QuestionContainer section={question.section} question={question.question}>
      <MultiSelectGroup
        name="demo-tools"
        options={question.options}
        value={values}
        onValueChange={setValues}
      />

      <NavigationControls
        onBack={() => router.push("/interview/question")}
        onSkip={
          question.required ? undefined : () => router.push("/interview/review")
        }
        onContinue={() => router.push("/interview/review")}
        continueDisabled={question.required && values.length === 0}
      />
    </QuestionContainer>
  );
}
