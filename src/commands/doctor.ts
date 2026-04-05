import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import {
  EMPTY_MATCHER_NOTE,
  HOOK_DETECT_COMMAND,
  HOOK_REMIND_COMMAND,
  LEARNINGS_FILES,
  MATCHING_PROMPT_NOTE
} from "../lib/constants.js";
import { parseMarkdownEntries, toLearningEntryDetails } from "../lib/markdown.js";
import { PackageLayout } from "../lib/package.js";

export interface DoctorOptions {
  workspace?: string;
}

export interface DoctorContext {
  cwd: string;
  packageLayout: PackageLayout;
}

export async function runDoctor(options: DoctorOptions, context: DoctorContext): Promise<string> {
  const workspace = path.resolve(context.cwd, options.workspace || ".");
  const learningsDir = path.join(workspace, ".learnings");
  const workspaceLearningsPath = path.join(learningsDir, "LEARNINGS.md");
  const hooksSetupPath = path.join(context.packageLayout.packageRoot, "references", "hooks-setup.md");
  const results: string[] = [];

  results.push(
    (await exists(path.join(context.packageLayout.packageRoot, "dist", "cli.js")))
      ? `[ok] CLI build exists at ${path.join(context.packageLayout.packageRoot, "dist", "cli.js")}`
      : `[warn] Missing dist/cli.js. Run npm run build before using the documented CLI entrypoint.`
  );

  for (const fileName of LEARNINGS_FILES) {
    const filePath = path.join(learningsDir, fileName);
    results.push(
      (await exists(filePath))
        ? `[ok] Workspace learnings file present: ${filePath}`
        : `[warn] Missing workspace learnings file: ${filePath}. Run node ./dist/cli.js init`
    );
  }

  results.push(
    context.packageLayout.installedUnderSkillsRoot
      ? `[ok] Package layout matches installed skills root: ${context.packageLayout.packageRoot}`
      : `[warn] Package is running from a repo/dev checkout. Default skill extraction will target ${context.packageLayout.defaultSkillsRoot}`
  );

  const hooksSetupContent = await readFile(hooksSetupPath, "utf8");
  const hookCommandsPresent =
    hooksSetupContent.includes(HOOK_REMIND_COMMAND) &&
    hooksSetupContent.includes(HOOK_DETECT_COMMAND);
  results.push(
    hookCommandsPresent
      ? `[ok] Hook setup guide points to the CLI entrypoints.`
      : `[warn] Hook setup guide is missing the CLI commands for remind and detect-error.`
  );

  const matcherVerificationAligned =
    hooksSetupContent.includes(MATCHING_PROMPT_NOTE) &&
    hooksSetupContent.includes(EMPTY_MATCHER_NOTE);
  results.push(
    matcherVerificationAligned
      ? `[ok] Hook verification guidance is aligned with the published matcher strategy.`
      : `[warn] Hook verification guidance does not explain how to test with a matching or empty matcher.`
  );

  if (await exists(workspaceLearningsPath)) {
    const learningsContent = await readFile(workspaceLearningsPath, "utf8");
    const promotedWarnings = getPromotionWarnings(learningsContent);
    results.push(...promotedWarnings);
  } else {
    results.push(
      `[warn] Promotion metadata checks skipped because the workspace learnings file is missing: ${workspaceLearningsPath}`
    );
  }

  return `${results.join("\n")}\n`;
}

function getPromotionWarnings(content: string): string[] {
  const warnings: string[] = [];
  for (const entry of parseMarkdownEntries(content)) {
    const details = toLearningEntryDetails(entry);
    if (details.status === "promoted" && !details.promotedTo) {
      warnings.push(`[warn] ${details.id} is marked promoted but does not record Promoted-To.`);
    }

    if (details.status === "promoted_to_skill" && !details.skillPath) {
      warnings.push(`[warn] ${details.id} is marked promoted_to_skill but does not record Skill-Path.`);
    }
  }

  return warnings.length ? warnings : ["[ok] Promotion metadata checks passed."];
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}
