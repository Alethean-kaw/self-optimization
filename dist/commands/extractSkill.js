import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { findMarkdownEntry, toLearningEntryDetails } from "../lib/markdown.js";
import { ensureTrailingNewline, humanizeSlug, isAbsoluteOrParentPath, stripTrailingPunctuation } from "../lib/utils.js";
export async function runExtractSkill(options, context) {
    validateSkillName(options.skillName);
    const outputRoot = resolveOutputRoot(options.outputDir, context);
    const skillPath = path.join(outputRoot, options.skillName);
    const learningSourcePath = resolveLearningSourcePath(options, context.cwd);
    const learningSeed = options.fromLearningId
        ? await loadLearningSeed(options.fromLearningId, learningSourcePath)
        : undefined;
    const skillDocument = buildSkillDocument({
        skillName: options.skillName,
        sourceLearningFile: learningSourcePath,
        learningSeed
    });
    if (options.dryRun) {
        return ensureTrailingNewline([
            "[INFO] Dry run - would create:",
            `  ${skillPath}/`,
            `  ${path.join(skillPath, "SKILL.md")}`,
            "",
            "Template content would be:",
            "---",
            skillDocument,
            "---"
        ].join("\n"));
    }
    if (await pathExists(skillPath)) {
        throw new Error(`Skill already exists: ${skillPath}`);
    }
    await mkdir(skillPath, { recursive: true });
    await writeFile(path.join(skillPath, "SKILL.md"), skillDocument, "utf8");
    return ensureTrailingNewline([
        `[INFO] Created: ${path.join(skillPath, "SKILL.md")}`,
        "",
        "Next steps:",
        `  1. Review ${path.join(skillPath, "SKILL.md")}`,
        "  2. Fill in any remaining TODO sections",
        "  3. Add references/ or scripts/ if the skill needs them",
        "  4. Update the original learning entry with:",
        "     **Status**: promoted_to_skill",
        `     **Skill-Path**: ${skillPath}`
    ].join("\n"));
}
function resolveOutputRoot(outputDir, context) {
    if (!outputDir) {
        return context.packageLayout.defaultSkillsRoot;
    }
    if (isAbsoluteOrParentPath(outputDir)) {
        throw new Error("Output directory must be a relative path under the current working directory.");
    }
    return path.resolve(context.cwd, outputDir);
}
function resolveLearningSourcePath(options, cwd) {
    if (!options.sourceLearningFile) {
        return path.join(cwd, ".learnings", "LEARNINGS.md");
    }
    return path.resolve(cwd, options.sourceLearningFile);
}
async function loadLearningSeed(fromLearningId, sourceLearningFile) {
    const content = await readFile(sourceLearningFile, "utf8").catch(() => {
        throw new Error(`Learning source file not found: ${sourceLearningFile}`);
    });
    const entry = findMarkdownEntry(content, fromLearningId);
    if (!entry) {
        throw new Error(`Learning ID ${fromLearningId} was not found in ${sourceLearningFile}.`);
    }
    return {
        ...toLearningEntryDetails(entry),
        sourceLearningFile
    };
}
function buildSkillDocument(input) {
    const title = input.learningSeed?.summary
        ? stripTrailingPunctuation(input.learningSeed.summary)
        : humanizeSlug(input.skillName);
    const intro = input.learningSeed?.summary || "[TODO: Brief introduction explaining the skill's purpose]";
    const background = input.learningSeed?.details || "[TODO: Explain why this workflow matters]";
    const solution = input.learningSeed?.suggestedAction || "[TODO: Document the stable workflow or command sequence]";
    const learningId = input.learningSeed?.id || "[TODO: Add original learning ID]";
    const originalFile = input.learningSeed?.sourceLearningFile || "[TODO: Add original learning file path]";
    return ensureTrailingNewline(`---
name: ${input.skillName}
description: "[TODO: Add a concise description of what this skill does and when to use it]"
---

# ${title}

${intro}

## Quick Reference

| Situation | Action |
|-----------|--------|
| [Trigger condition] | [What to do] |

## Background

${background}

## Solution

${solution}

## Examples

[TODO: Add concrete examples]

## Source Learning

This skill was extracted from a learning entry.
- Learning ID: ${learningId}
- Original File: ${originalFile}
`);
}
function validateSkillName(skillName) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(skillName)) {
        throw new Error("Invalid skill name format. Use lowercase letters, numbers, and hyphens only.");
    }
}
async function pathExists(filePath) {
    try {
        await stat(filePath);
        return true;
    }
    catch {
        return false;
    }
}
