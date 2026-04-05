import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runExtractSkill } from "../src/commands/extractSkill.js";
import { PackageLayout } from "../src/lib/package.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "self-optimization-extract-"));
  tempDirs.push(dir);
  return dir;
}

function makeLayout(packageRoot: string, installedUnderSkillsRoot: boolean): PackageLayout {
  return {
    packageRoot,
    installedUnderSkillsRoot,
    defaultSkillsRoot: installedUnderSkillsRoot ? path.dirname(packageRoot) : path.join(packageRoot, "skills")
  };
}

describe("runExtractSkill", () => {
  it("uses the installed skills root when running from an installed layout", async () => {
    const skillsRoot = await createTempDir();
    const packageRoot = path.join(skillsRoot, "self-optimization");

    const output = await runExtractSkill({
      skillName: "demo-skill",
      dryRun: true
    }, {
      cwd: packageRoot,
      packageLayout: makeLayout(packageRoot, true)
    });

    expect(output).toContain(path.join(skillsRoot, "demo-skill"));
  });

  it("uses packageRoot/skills in a repo checkout", async () => {
    const packageRoot = await createTempDir();

    const output = await runExtractSkill({
      skillName: "demo-skill",
      dryRun: true
    }, {
      cwd: packageRoot,
      packageLayout: makeLayout(packageRoot, false)
    });

    expect(output).toContain(path.join(packageRoot, "skills", "demo-skill"));
  });

  it("supports from-learning-id prefill", async () => {
    const packageRoot = await createTempDir();
    const cwd = await createTempDir();
    const learningsDir = path.join(cwd, ".learnings");
    await mkdir(learningsDir, { recursive: true });
    const learningFile = path.join(learningsDir, "LEARNINGS.md");
    await writeFile(learningFile, `## [LRN-20260405-001] best_practice

**Logged**: 2026-04-05T00:00:00Z
**Priority**: high
**Status**: pending
**Area**: docs

### Summary
Prefer CLI-first documentation

### Details
The package now uses a TypeScript CLI instead of shell scripts.

### Suggested Action
Document node ./dist/cli.js in every setup guide.

---
`, "utf8");

    const output = await runExtractSkill({
      skillName: "cli-docs",
      dryRun: true,
      fromLearningId: "LRN-20260405-001",
      sourceLearningFile: learningFile
    }, {
      cwd,
      packageLayout: makeLayout(packageRoot, false)
    });

    expect(output).toContain("Prefer CLI-first documentation");
    expect(output).toContain("Document node ./dist/cli.js in every setup guide.");
  });

  it("rejects output directories that escape the workspace", async () => {
    const packageRoot = await createTempDir();

    await expect(runExtractSkill({
      skillName: "demo-skill",
      dryRun: true,
      outputDir: "../outside"
    }, {
      cwd: packageRoot,
      packageLayout: makeLayout(packageRoot, false)
    })).rejects.toThrow("Output directory must be a relative path");
  });

  it("does not overwrite an existing skill directory", async () => {
    const packageRoot = await createTempDir();
    await mkdir(path.join(packageRoot, "skills", "demo-skill"), { recursive: true });

    await expect(runExtractSkill({
      skillName: "demo-skill"
    }, {
      cwd: packageRoot,
      packageLayout: makeLayout(packageRoot, false)
    })).rejects.toThrow("Skill already exists");
  });
});
