"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getQuestionById } from "@/config/interview";
import { sectionVariants, transitions } from "@/lib/motion";

interface ReviewItem {
  questionId: string;
  answer: string;
  editHref: string;
}

// Mock answers for the static prototype — Phase 2 reads real responses here.
const reviewItems: ReviewItem[] = [
  {
    questionId: "demo-role",
    answer: "Product Manager",
    editHref: "/interview/profile",
  },
  {
    questionId: "demo-confidence",
    answer: "4 / 5 — Very confident",
    editHref: "/interview/profile",
  },
  {
    questionId: "demo-tools",
    answer: "Analytics platform, AI assistant",
    editHref: "/interview/question-choice",
  },
  {
    questionId: "demo-data-quality",
    answer:
      "Normally our analytics team pulls the last quarter of usage data and cross-checks it against support tickets before we trust a trend.",
    editHref: "/interview/question",
  },
];

export function ReviewContent() {
  return (
    <motion.div
      variants={sectionVariants}
      initial="enter"
      animate="center"
      transition={transitions.base}
      className="flex w-full max-w-(--width-content) flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-medium sm:text-2xl">Review your answers</h1>
        <p className="text-sm text-muted-foreground">
          You can go back and change anything before submitting.
        </p>
      </div>

      <ul className="flex flex-col gap-4">
        {reviewItems.map((item) => {
          const question = getQuestionById(item.questionId);
          if (!question) return null;
          return (
            <li
              key={item.questionId}
              className="flex flex-col gap-1 rounded-lg border p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium">{question.title}</p>
                <Link
                  href={item.editHref}
                  className="shrink-0 text-sm text-primary underline-offset-4 hover:underline"
                >
                  Edit
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">{item.answer}</p>
            </li>
          );
        })}
      </ul>

      <div>
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/interview/complete" />}
        >
          Submit
        </Button>
      </div>
    </motion.div>
  );
}
