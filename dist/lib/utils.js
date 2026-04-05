import os from "node:os";
import path from "node:path";
export function firstNonEmpty(...values) {
    for (const value of values) {
        if (value !== undefined && value.trim() !== "") {
            return value;
        }
    }
    return undefined;
}
export function parsePositiveInteger(value, fallback) {
    if (!value) {
        return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback;
    }
    return parsed;
}
export function parseInteger(value) {
    if (!value) {
        return undefined;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
}
export function humanizeSlug(slug) {
    return slug
        .split(/[-_]+/g)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}
export function normalizeHeadingToken(value, separator = "_") {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, separator)
        .replace(new RegExp(`${separator}+`, "g"), separator)
        .replace(new RegExp(`^${separator}|${separator}$`, "g"), "");
}
export function ensureTrailingNewline(value) {
    return value.endsWith("\n") ? value : `${value}\n`;
}
export function stripTrailingPunctuation(value) {
    return value.trim().replace(/[.!?]+$/g, "");
}
export function defaultStateBaseDir(env) {
    return env.XDG_STATE_HOME || os.tmpdir();
}
export function isAbsoluteOrParentPath(input) {
    if (path.isAbsolute(input)) {
        return true;
    }
    return input.split(/[\\/]+/).includes("..");
}
export async function readStdinIfAvailable() {
    if (process.stdin.isTTY) {
        return undefined;
    }
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const content = Buffer.concat(chunks).toString("utf8");
    return content === "" ? undefined : content;
}
