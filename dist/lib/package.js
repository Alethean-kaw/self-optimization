import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export function findPackageRoot(fromUrl) {
    let current = path.dirname(fileURLToPath(fromUrl));
    while (true) {
        const hasMeta = fs.existsSync(path.join(current, "_meta.json"));
        const hasSkill = fs.existsSync(path.join(current, "SKILL.md"));
        if (hasMeta && hasSkill) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current) {
            throw new Error("Unable to locate package root for self-optimization.");
        }
        current = parent;
    }
}
export function getPackageLayout(packageRoot) {
    const installedUnderSkillsRoot = path.basename(packageRoot) === "self-optimization" &&
        path.basename(path.dirname(packageRoot)) === "skills";
    return {
        packageRoot,
        installedUnderSkillsRoot,
        defaultSkillsRoot: installedUnderSkillsRoot
            ? path.dirname(packageRoot)
            : path.join(packageRoot, "skills")
    };
}
