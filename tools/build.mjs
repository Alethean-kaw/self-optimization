import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = path.join(rootDir, "dist");
const tscEntry = path.join(rootDir, "node_modules", "typescript", "bin", "tsc");

await rm(distDir, { force: true, recursive: true });
execFileSync(process.execPath, [tscEntry, "-p", "tsconfig.json"], {
  cwd: rootDir,
  stdio: "inherit"
});

const hookSourcePath = path.join(rootDir, "hooks", "openclaw", "handler.ts");
const hookOutputPath = path.join(rootDir, "hooks", "openclaw", "handler.js");
const hookSource = await readFile(hookSourcePath, "utf8");
const transpiledHook = ts.transpileModule(hookSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022
  },
  fileName: hookSourcePath
});

await mkdir(path.dirname(hookOutputPath), { recursive: true });
await writeFile(hookOutputPath, transpiledHook.outputText, "utf8");
