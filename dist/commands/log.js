import { appendFile, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { VALID_AREAS, VALID_COMPLEXITIES, VALID_FREQUENCIES, VALID_PRIORITIES, VALID_REPRODUCIBLE } from "../lib/constants.js";
import { formatLogEntry, buildNextEntryId } from "../lib/logEntries.js";
export async function runLog(options, context) {
    const targetFile = resolveTargetFile(options.type, context.cwd);
    if (!(await exists(targetFile))) {
        throw new Error(`Missing learnings file: ${targetFile}. Run node ./dist/cli.js init first.`);
    }
    validateCommon(options);
    const entryInput = buildEntryInput(options);
    const now = context.now?.() || new Date();
    const existingContent = await readFile(targetFile, "utf8");
    const entryId = buildNextEntryId(options.type, existingContent, now);
    const entry = formatLogEntry(entryId, entryInput, now);
    const separator = existingContent.endsWith("\n\n") ? "" : "\n";
    await appendFile(targetFile, `${separator}${entry}`, "utf8");
    return `[created] ${entryId} -> ${targetFile}\n`;
}
function resolveTargetFile(type, cwd) {
    const learningsDir = path.join(cwd, ".learnings");
    switch (type) {
        case "learning":
            return path.join(learningsDir, "LEARNINGS.md");
        case "error":
            return path.join(learningsDir, "ERRORS.md");
        case "feature":
            return path.join(learningsDir, "FEATURE_REQUESTS.md");
    }
}
function validateCommon(options) {
    if (!options.area || !VALID_AREAS.includes(options.area)) {
        throw new Error(`--area is required and must be one of: ${VALID_AREAS.join(", ")}`);
    }
    if (options.priority && !VALID_PRIORITIES.includes(options.priority)) {
        throw new Error(`--priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
    }
}
function buildEntryInput(options) {
    const base = {
        area: options.area,
        priority: options.priority,
        relatedFiles: options.relatedFile,
        tags: options.tag,
        seeAlso: options.seeAlso
    };
    if (options.type === "learning") {
        requireFields(options, ["category", "summary", "details", "suggestedAction"]);
        const input = {
            ...base,
            type: "learning",
            category: options.category,
            summary: options.summary,
            details: options.details,
            suggestedAction: options.suggestedAction,
            source: options.source,
            patternKey: options.patternKey
        };
        return input;
    }
    if (options.type === "error") {
        requireFields(options, ["tool", "summary", "errorText", "suggestedFix"]);
        if (options.reproducible && !VALID_REPRODUCIBLE.includes(options.reproducible)) {
            throw new Error(`--reproducible must be one of: ${VALID_REPRODUCIBLE.join(", ")}`);
        }
        const input = {
            ...base,
            type: "error",
            tool: options.tool,
            summary: options.summary,
            errorText: options.errorText,
            suggestedFix: options.suggestedFix,
            reproducible: options.reproducible
        };
        return input;
    }
    requireFields(options, ["capability", "userContext", "complexity", "suggestedImplementation"]);
    if (!VALID_COMPLEXITIES.includes(options.complexity)) {
        throw new Error(`--complexity must be one of: ${VALID_COMPLEXITIES.join(", ")}`);
    }
    if (options.frequency && !VALID_FREQUENCIES.includes(options.frequency)) {
        throw new Error(`--frequency must be one of: ${VALID_FREQUENCIES.join(", ")}`);
    }
    const input = {
        ...base,
        type: "feature",
        capability: options.capability,
        userContext: options.userContext,
        complexity: options.complexity,
        suggestedImplementation: options.suggestedImplementation,
        frequency: options.frequency
    };
    return input;
}
function requireFields(options, fieldNames) {
    for (const fieldName of fieldNames) {
        const value = options[fieldName];
        if (typeof value !== "string" || value.trim() === "") {
            throw new Error(`--${camelToKebab(fieldName)} is required for log type "${options.type}"`);
        }
    }
}
function camelToKebab(value) {
    return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
async function exists(filePath) {
    try {
        await stat(filePath);
        return true;
    }
    catch {
        return false;
    }
}
