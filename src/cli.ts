#!/usr/bin/env node

import { parseArgs } from "node:util";

import { runDetectError } from "./commands/detectError.js";
import { runDoctor } from "./commands/doctor.js";
import { runExtractSkill } from "./commands/extractSkill.js";
import { runInit } from "./commands/init.js";
import { runLog } from "./commands/log.js";
import { runRemind } from "./commands/remind.js";
import { findPackageRoot, getPackageLayout } from "./lib/package.js";
import { readStdinIfAvailable } from "./lib/utils.js";

const packageRoot = findPackageRoot(import.meta.url);
const packageLayout = getPackageLayout(packageRoot);

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help") {
    printHelp();
    return;
  }

  switch (command) {
    case "remind":
      await writeOutput(await runRemind(parseRemindArgs(rest), {
        cwd: process.cwd(),
        env: process.env
      }));
      return;
    case "detect-error":
      await writeOutput(await runDetectError(parseDetectErrorArgs(rest), {
        env: process.env,
        stdinText: await readStdinIfAvailable()
      }));
      return;
    case "extract-skill":
      await writeOutput(await runExtractSkill(parseExtractSkillArgs(rest), {
        cwd: process.cwd(),
        packageLayout
      }));
      return;
    case "init":
      await writeOutput(await runInit(parseInitArgs(rest), {
        cwd: process.cwd(),
        packageRoot
      }));
      return;
    case "doctor":
      await writeOutput(await runDoctor(parseDoctorArgs(rest), {
        cwd: process.cwd(),
        packageLayout
      }));
      return;
    case "log":
      await writeOutput(await runLog(parseLogArgs(rest), {
        cwd: process.cwd()
      }));
      return;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

function parseRemindArgs(args: string[]) {
  const parsed = parseArgs({
    args,
    options: {
      "session-key": { type: "string" },
      workspace: { type: "string" },
      "cooldown-seconds": { type: "string" },
      "state-dir": { type: "string" }
    },
    allowPositionals: false
  });

  return {
    sessionKey: parsed.values["session-key"],
    workspace: parsed.values.workspace,
    cooldownSeconds: parsed.values["cooldown-seconds"],
    stateDir: parsed.values["state-dir"]
  };
}

function parseDetectErrorArgs(args: string[]) {
  const parsed = parseArgs({
    args,
    options: {
      text: { type: "string" },
      "exit-code": { type: "string" }
    },
    allowPositionals: false
  });

  return {
    text: parsed.values.text,
    exitCode: parsed.values["exit-code"]
  };
}

function parseExtractSkillArgs(args: string[]) {
  const parsed = parseArgs({
    args,
    options: {
      "dry-run": { type: "boolean" },
      "output-dir": { type: "string" },
      "source-learning-file": { type: "string" },
      "from-learning-id": { type: "string" }
    },
    allowPositionals: true
  });
  const skillName = parsed.positionals[0];
  if (!skillName) {
    throw new Error("extract-skill requires a <skill-name> positional argument.");
  }

  return {
    skillName,
    dryRun: parsed.values["dry-run"],
    outputDir: parsed.values["output-dir"],
    sourceLearningFile: parsed.values["source-learning-file"],
    fromLearningId: parsed.values["from-learning-id"]
  };
}

function parseInitArgs(args: string[]) {
  const parsed = parseArgs({
    args,
    options: {
      workspace: { type: "string" }
    },
    allowPositionals: false
  });

  return {
    workspace: parsed.values.workspace
  };
}

function parseDoctorArgs(args: string[]) {
  const parsed = parseArgs({
    args,
    options: {
      workspace: { type: "string" }
    },
    allowPositionals: false
  });

  return {
    workspace: parsed.values.workspace
  };
}

function parseLogArgs(args: string[]) {
  const parsed = parseArgs({
    args,
    options: {
      type: { type: "string" },
      category: { type: "string" },
      summary: { type: "string" },
      details: { type: "string" },
      "suggested-action": { type: "string" },
      area: { type: "string" },
      priority: { type: "string" },
      source: { type: "string" },
      "related-file": { type: "string", multiple: true },
      tag: { type: "string", multiple: true },
      "see-also": { type: "string", multiple: true },
      "pattern-key": { type: "string" },
      tool: { type: "string" },
      "error-text": { type: "string" },
      "suggested-fix": { type: "string" },
      reproducible: { type: "string" },
      capability: { type: "string" },
      "user-context": { type: "string" },
      complexity: { type: "string" },
      "suggested-implementation": { type: "string" },
      frequency: { type: "string" }
    },
    allowPositionals: false
  });

  const type = parsed.values.type as "learning" | "error" | "feature" | undefined;
  if (type !== "learning" && type !== "error" && type !== "feature") {
    throw new Error(`--type is required and must be one of: learning, error, feature`);
  }

  return {
    type,
    category: parsed.values.category,
    summary: parsed.values.summary,
    details: parsed.values.details,
    suggestedAction: parsed.values["suggested-action"],
    area: parsed.values.area,
    priority: parsed.values.priority,
    source: parsed.values.source,
    relatedFile: parsed.values["related-file"],
    tag: parsed.values.tag,
    seeAlso: parsed.values["see-also"],
    patternKey: parsed.values["pattern-key"],
    tool: parsed.values.tool,
    errorText: parsed.values["error-text"],
    suggestedFix: parsed.values["suggested-fix"],
    reproducible: parsed.values.reproducible,
    capability: parsed.values.capability,
    userContext: parsed.values["user-context"],
    complexity: parsed.values.complexity,
    suggestedImplementation: parsed.values["suggested-implementation"],
    frequency: parsed.values.frequency
  };
}

async function writeOutput(output: string): Promise<void> {
  if (output) {
    process.stdout.write(output);
  }
}

function printHelp(): void {
  process.stdout.write(`self-optimization CLI

Usage:
  node ./dist/cli.js remind
  node ./dist/cli.js detect-error
  node ./dist/cli.js extract-skill <skill-name>
  node ./dist/cli.js init
  node ./dist/cli.js doctor
  node ./dist/cli.js log --type learning|error|feature ...
`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
