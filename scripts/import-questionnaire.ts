import { readFile, rename, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { parseArgs } from "node:util";

import { hashDefinition } from "@/features/questionnaire/definition-hash";
import {
  compileQuestions,
  parseQuestionText,
} from "@/features/questionnaire/import-questions";
import { parseInterviewConfig } from "@/lib/validation/interview-config";

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      check: { type: "boolean", default: false },
      output: { type: "string" },
    },
  });
  if (positionals.length !== 1) {
    throw new Error(
      "Usage: npm run questionnaire:import -- <questions.txt|md|json> [--check] [--output path.json]"
    );
  }
  const inputPath = resolve(positionals[0]);
  const extension = extname(inputPath).toLowerCase();
  if (![".json", ".txt", ".md"].includes(extension)) {
    throw new Error("Use a .json, .txt or .md question file.");
  }
  const text = (await readFile(inputPath, "utf8")).replace(/^\uFEFF/, "");
  const config = compileQuestions(
    extension === ".json" ? JSON.parse(text) : parseQuestionText(text)
  );
  if (!values.check && !values.output) {
    throw new Error(
      "Questionnaire V1 is frozen. Supply --output <review.json>; activating a future version requires a separate additive registry and publisher."
    );
  }
  const outputPath = values.output ? resolve(values.output) : null;
  if (outputPath && inputPath === outputPath && !values.check) {
    throw new Error(
      "Input and output must be different files. Use --check to validate the active configuration."
    );
  }

  if (outputPath) {
    try {
      const current = parseInterviewConfig(
        JSON.parse(await readFile(outputPath, "utf8"))
      );
      if (
        current.version === config.version &&
        hashDefinition(current) !== hashDefinition(config)
      ) {
        throw new Error(
          `Version ${config.version} already has different content. Change the version or omit it for automatic versioning.`
        );
      }
    } catch (error) {
      if (!(
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ))
        throw error;
    }
  }

  console.log(
    `Validated ${config.questions.length} questions in ${config.sections.length} sections (${config.version}).`
  );
  if (values.check) return;
  if (!outputPath) return;
  const temporary = `${outputPath}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(config, null, 2) + "\n", "utf8");
  await rename(temporary, outputPath);
  console.log(`Written to ${outputPath}`);
  console.log(
    "Review definition generated. Do not replace frozen V1 or V2 definitions; implement a future version through a separate additive registry and publisher."
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
