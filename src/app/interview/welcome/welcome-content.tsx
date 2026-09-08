"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { sectionVariants, transitions } from "@/lib/motion";

const highlights = [
  "About 20–30 minutes, pause any time",
  "Responses are anonymized",
  "Answer by typing or speaking",
];

export function WelcomeContent() {
  return (
    <motion.div
      variants={sectionVariants}
      initial="enter"
      animate="center"
      transition={transitions.base}
      className="flex w-full max-w-(--width-content-narrow) flex-col gap-8 text-center"
    >
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-medium text-balance sm:text-3xl">
          Help us understand how product decisions are made with data and AI.
        </h1>
        <p className="text-muted-foreground">
          A short research interview for product professionals.
        </p>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div>
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/interview/consent" />}
        >
          Begin
        </Button>
      </div>
    </motion.div>
  );
}
