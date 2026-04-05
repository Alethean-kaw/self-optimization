import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runInit } from "../src/commands/init.js";
import { runLog } from "../src/commands/log.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "self-optimization-init-"));
  tempDirs.push(dir);
  return dir;
}

describe("init and log", () => {
  it("creates the three learnings files and does not overwrite existing ones", async () => {
    const packageRoot = await createTempDir();
    const workspace = await createTempDir();
    const templateDir = path.join(packageRoot, ".learnings");
    await mkdir(templateDir, { recursive: true });
    await writeFile(path.join(templateDir, "LEARNINGS.md"), "# Learnings\n", "utf8");
    await writeFile(path.join(templateDir, "ERRORS.md"), "# Errors\n", "utf8");
    await writeFile(path.join(templateDir, "FEATURE_REQUESTS.md"), "# Feature Requests\n", "utf8");

    const first = await runInit({}, {
      cwd: workspace,
      packageRoot
    });

    const second = await runInit({}, {
      cwd: workspace,
      packageRoot
    });

    expect(first).toContain("[created]");
    expect(second).toContain("[exists]");
  });

  it("appends a learning entry with an incremented id", async () => {
    const workspace = await createTempDir();
    const learningsDir = path.join(workspace, ".learnings");
    await mkdir(learningsDir, { recursive: true });
    await writeFile(path.join(learningsDir, "LEARNINGS.md"), "# Learnings\n", "utf8");

    await runLog({
      type: "learning",
      category: "best_practice",
      summary: "Prefer CLI-first workflows",
      details: "Shell scripts are gone.",
      suggestedAction: "Use node ./dist/cli.js",
      area: "docs"
    }, {
      cwd: workspace,
      now: () => new Date("2026-04-05T00:00:00.000Z")
    });

    const output = await runLog({
      type: "learning",
      category: "best_practice",
      summary: "Keep docs in sync",
      details: "Hook and CLI docs must match.",
      suggestedAction: "Update references together.",
      area: "docs"
    }, {
      cwd: workspace,
      now: () => new Date("2026-04-05T00:01:00.000Z")
    });

    const content = await readFile(path.join(learningsDir, "LEARNINGS.md"), "utf8");
    expect(content).toContain("LRN-20260405-001");
    expect(content).toContain("LRN-20260405-002");
    expect(output).toContain("LRN-20260405-002");
  });
});
