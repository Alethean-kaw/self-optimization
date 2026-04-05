import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

import { LEARNINGS_FILES } from "../lib/constants.js";

export interface InitOptions {
  workspace?: string;
}

export interface InitContext {
  cwd: string;
  packageRoot: string;
}

export async function runInit(options: InitOptions, context: InitContext): Promise<string> {
  const workspace = path.resolve(context.cwd, options.workspace || ".");
  const learningsDir = path.join(workspace, ".learnings");
  const templateDir = path.join(context.packageRoot, ".learnings");

  await mkdir(learningsDir, { recursive: true });

  const lines = [`Workspace: ${workspace}`];
  for (const fileName of LEARNINGS_FILES) {
    const source = path.join(templateDir, fileName);
    const target = path.join(learningsDir, fileName);
    if (await exists(target)) {
      lines.push(`[exists] ${target}`);
      continue;
    }

    await copyFile(source, target);
    lines.push(`[created] ${target}`);
  }

  return `${lines.join("\n")}\n`;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}
