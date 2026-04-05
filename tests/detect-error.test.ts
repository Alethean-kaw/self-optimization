import { describe, expect, it } from "vitest";

import { ERROR_BLOCK } from "../src/lib/constants.js";
import { runDetectError, shouldDetectError } from "../src/commands/detectError.js";

describe("detect-error", () => {
  it("detects compiler and runtime failures", () => {
    expect(shouldDetectError("src/app.ts:1:1 - error TS2322: bad assignment", 0)).toBe(true);
    expect(shouldDetectError("error[E0432]: unresolved import foo", 0)).toBe(true);
    expect(shouldDetectError("Traceback (most recent call last):", 0)).toBe(true);
    expect(shouldDetectError("npm ERR! missing script: build", 0)).toBe(true);
  });

  it("fires on any non-zero exit code even without text", () => {
    expect(shouldDetectError(undefined, 1)).toBe(true);
  });

  it("does not flag successful summaries", () => {
    expect(shouldDetectError("42 passed, 0 failed", 0)).toBe(false);
    expect(shouldDetectError("0 errors, 0 warnings", 0)).toBe(false);
    expect(shouldDetectError("All good", 0)).toBe(false);
  });

  it("emits the error reminder block when triggered", async () => {
    const output = await runDetectError({
      text: "fatal: unable to access origin"
    }, {
      env: {}
    });

    expect(output).toBe(ERROR_BLOCK);
  });
});
