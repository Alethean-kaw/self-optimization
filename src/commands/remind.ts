import { createHash } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";

import { REMINDER_BLOCK } from "../lib/constants.js";
import { defaultStateBaseDir, firstNonEmpty, parsePositiveInteger } from "../lib/utils.js";

export interface RemindOptions {
  sessionKey?: string;
  workspace?: string;
  cooldownSeconds?: string;
  stateDir?: string;
}

export interface RemindContext {
  cwd: string;
  env: NodeJS.ProcessEnv;
  now?: () => Date;
}

export async function runRemind(options: RemindOptions, context: RemindContext): Promise<string> {
  const now = context.now?.() || new Date();
  const sessionKey = firstNonEmpty(
    options.sessionKey,
    context.env.CLAUDE_SESSION_ID,
    context.env.CODEX_SESSION_ID,
    context.env.OPENCLAW_SESSION_KEY,
    context.env.SESSION_ID
  );
  const workspace = await resolveWorkspace(options.workspace || context.cwd);
  const cooldownSeconds = parsePositiveInteger(
    firstNonEmpty(options.cooldownSeconds, context.env.SELF_OPTIMIZATION_REMINDER_COOLDOWN_SECONDS),
    1800
  );
  const stateDir = options.stateDir
    ? path.resolve(context.cwd, options.stateDir)
    : path.join(defaultStateBaseDir(context.env), "self-optimization");
  const scopeKey = sessionKey
    ? `session:${sessionKey}:${workspace}`
    : `workspace:${workspace}`;
  const fileHash = createHash("sha256").update(scopeKey).digest("hex");
  const stateFile = path.join(stateDir, `remind-${fileHash}.txt`);

  try {
    await mkdir(stateDir, { recursive: true });

    if (cooldownSeconds > 0) {
      const previousValue = await readFile(stateFile, "utf8").catch(() => undefined);
      const previousSeconds = Number.parseInt((previousValue || "").trim(), 10);
      if (Number.isFinite(previousSeconds)) {
        const elapsed = Math.floor(now.getTime() / 1000) - previousSeconds;
        if (elapsed < cooldownSeconds) {
          return "";
        }
      }
    }

    await writeFile(stateFile, `${Math.floor(now.getTime() / 1000)}\n`, "utf8");
  } catch {
    return REMINDER_BLOCK;
  }

  return REMINDER_BLOCK;
}

async function resolveWorkspace(input: string): Promise<string> {
  const candidate = path.resolve(input);
  try {
    return await realpath(candidate);
  } catch {
    return candidate;
  }
}
