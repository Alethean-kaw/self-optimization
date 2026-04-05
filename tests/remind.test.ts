import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { REMINDER_BLOCK } from "../src/lib/constants.js";
import { runRemind } from "../src/commands/remind.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "self-optimization-remind-"));
  tempDirs.push(dir);
  return dir;
}

describe("runRemind", () => {
  it("prints once per session and workspace during the cooldown window", async () => {
    const workspace = await createTempDir();
    const stateDir = await createTempDir();
    const now = new Date("2026-04-05T00:00:00.000Z");

    const first = await runRemind({
      sessionKey: "session-a",
      workspace,
      cooldownSeconds: "1800",
      stateDir
    }, {
      cwd: workspace,
      env: {},
      now: () => now
    });

    const second = await runRemind({
      sessionKey: "session-a",
      workspace,
      cooldownSeconds: "1800",
      stateDir
    }, {
      cwd: workspace,
      env: {},
      now: () => new Date("2026-04-05T00:05:00.000Z")
    });

    expect(first).toBe(REMINDER_BLOCK);
    expect(second).toBe("");
  });

  it("resets when the session changes", async () => {
    const workspace = await createTempDir();
    const stateDir = await createTempDir();

    const first = await runRemind({
      sessionKey: "session-a",
      workspace,
      stateDir
    }, {
      cwd: workspace,
      env: {}
    });

    const second = await runRemind({
      sessionKey: "session-b",
      workspace,
      stateDir
    }, {
      cwd: workspace,
      env: {}
    });

    expect(first).toBe(REMINDER_BLOCK);
    expect(second).toBe(REMINDER_BLOCK);
  });

  it("falls back to workspace-based dedupe and normalizes invalid cooldown values", async () => {
    const workspace = await createTempDir();
    const stateDir = await createTempDir();

    await runRemind({
      workspace,
      cooldownSeconds: "nope",
      stateDir
    }, {
      cwd: workspace,
      env: {},
      now: () => new Date("2026-04-05T00:00:00.000Z")
    });

    const second = await runRemind({
      workspace,
      cooldownSeconds: "nope",
      stateDir
    }, {
      cwd: workspace,
      env: {},
      now: () => new Date("2026-04-05T00:10:00.000Z")
    });

    expect(second).toBe("");
  });

  it("writes reminder state into a custom state directory", async () => {
    const workspace = await createTempDir();
    const stateDir = await createTempDir();

    await runRemind({
      workspace,
      stateDir
    }, {
      cwd: workspace,
      env: {}
    });

    const files = await readdir(stateDir);
    expect(files.some((file) => file.startsWith("remind-"))).toBe(true);
  });
});
