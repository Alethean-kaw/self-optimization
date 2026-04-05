import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runDoctor } from "../src/commands/doctor.js";
import { PackageLayout } from "../src/lib/package.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "self-optimization-doctor-"));
  tempDirs.push(dir);
  return dir;
}

function makeLayout(packageRoot: string): PackageLayout {
  return {
    packageRoot,
    installedUnderSkillsRoot: false,
    defaultSkillsRoot: path.join(packageRoot, "skills")
  };
}

describe("runDoctor", () => {
  it("checks promotion metadata in the workspace learnings file", async () => {
    const packageRoot = await createTempDir();
    const workspace = await createTempDir();
    await mkdir(path.join(packageRoot, "dist"), { recursive: true });
    await writeFile(path.join(packageRoot, "dist", "cli.js"), "// built\n", "utf8");
    await mkdir(path.join(packageRoot, "references"), { recursive: true });
    await writeFile(path.join(packageRoot, "references", "hooks-setup.md"), `node ./skills/self-optimization/dist/cli.js remind
node ./skills/self-optimization/dist/cli.js detect-error
Use a prompt that matches the configured \`matcher\`
temporarily set \`matcher\` to \`""\`
`, "utf8");
    await mkdir(path.join(packageRoot, ".learnings"), { recursive: true });
    await writeFile(path.join(packageRoot, ".learnings", "LEARNINGS.md"), `## [LRN-20260405-001] best_practice

**Logged**: 2026-04-05T00:00:00Z
**Priority**: high
**Status**: promoted_to_skill
**Area**: docs

### Summary
Keep skill extraction paths real

### Metadata
- Skill-Path: ~/.openclaw/skills/path-fixes

---
`, "utf8");
    await mkdir(path.join(workspace, ".learnings"), { recursive: true });
    await writeFile(path.join(workspace, ".learnings", "LEARNINGS.md"), `## [LRN-20260405-002] best_practice

**Logged**: 2026-04-05T00:00:00Z
**Priority**: high
**Status**: promoted_to_skill
**Area**: docs

### Summary
Workspace promotion metadata must be complete

### Metadata
- Source: debugging

---
`, "utf8");
    await writeFile(path.join(workspace, ".learnings", "ERRORS.md"), "# Errors\n", "utf8");
    await writeFile(path.join(workspace, ".learnings", "FEATURE_REQUESTS.md"), "# Features\n", "utf8");

    const report = await runDoctor({}, {
      cwd: workspace,
      packageLayout: makeLayout(packageRoot)
    });

    expect(report).toContain("[ok] CLI build exists");
    expect(report).toContain("[ok] Hook setup guide points to the CLI entrypoints.");
    expect(report).toContain("[warn] LRN-20260405-002 is marked promoted_to_skill but does not record Skill-Path.");
    expect(report).not.toContain("[ok] Promotion metadata checks passed.");
  });
});
