import { ERROR_BLOCK } from "../lib/constants.js";
import { firstNonEmpty, parseInteger } from "../lib/utils.js";

export interface DetectErrorOptions {
  text?: string;
  exitCode?: string;
}

export interface DetectErrorContext {
  env: NodeJS.ProcessEnv;
  stdinText?: string;
}

const strongPatterns = [
  /\berror:/i,
  /\bfatal:/i,
  /\berror\s+ts\d{3,5}:/i,
  /\berror\[[a-z]\d{4}\]:/i,
  /\btraceback\b/i,
  /\bexception\b/i,
  /\bmodule not found\b/i,
  /\bmodulenotfounderror\b/i,
  /\bpermission denied\b/i,
  /\bcommand not found\b/i,
  /\btimed out\b/i,
  /\bnpm err!/i
];

const countErrorPatterns = [
  /(^|[^0-9])([1-9][0-9]*) failed\b/i,
  /\bfailed to\b/i,
  /\bfailed with\b/i,
  /\bfailures?: [1-9][0-9]*\b/i,
  /\berrors?: [1-9][0-9]*\b/i,
  /\bexit code [1-9][0-9]*\b/i,
  /\bexited with code [1-9][0-9]*\b/i,
  /\bnon-zero exit\b/i
];

const successSummaryPatterns = [
  /\b0 failed\b/i,
  /\b0 errors?\b/i,
  /\b\d+\s+passed,\s*0\s+failed\b/i
];

export function shouldDetectError(text: string | undefined, exitCode: number | undefined): boolean {
  if (exitCode !== undefined && exitCode !== 0) {
    return true;
  }

  if (!text || text.trim() === "") {
    return false;
  }

  if (strongPatterns.some((pattern) => pattern.test(text))) {
    return true;
  }

  if (countErrorPatterns.some((pattern) => pattern.test(text))) {
    return true;
  }

  if (successSummaryPatterns.some((pattern) => pattern.test(text))) {
    return false;
  }

  return false;
}

export async function runDetectError(
  options: DetectErrorOptions,
  context: DetectErrorContext
): Promise<string> {
  const text = firstNonEmpty(
    options.text,
    context.stdinText,
    context.env.CLAUDE_TOOL_OUTPUT,
    context.env.CODEX_TOOL_OUTPUT,
    context.env.TOOL_OUTPUT
  );
  const exitCode = parseInteger(
    firstNonEmpty(
      options.exitCode,
      context.env.CLAUDE_TOOL_EXIT_CODE,
      context.env.CODEX_TOOL_EXIT_CODE,
      context.env.TOOL_EXIT_CODE,
      context.env.EXIT_CODE
    )
  );

  return shouldDetectError(text, exitCode) ? ERROR_BLOCK : "";
}
