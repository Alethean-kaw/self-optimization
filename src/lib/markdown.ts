import { ensureTrailingNewline } from "./utils.js";

export interface MarkdownEntry {
  id: string;
  label: string;
  raw: string;
}

export interface LearningEntryDetails {
  id: string;
  label: string;
  summary?: string;
  details?: string;
  suggestedAction?: string;
  status?: string;
  promotedTo?: string;
  skillPath?: string;
}

const ENTRY_HEADER_PATTERN = /^## \[(?<id>[A-Z]+-\d{8}-\d{3})\]\s+(?<label>[^\n]+)$/gm;

export function parseMarkdownEntries(content: string): MarkdownEntry[] {
  const matches = Array.from(content.matchAll(ENTRY_HEADER_PATTERN));
  const entries: MarkdownEntry[] = [];

  for (const [index, match] of matches.entries()) {
    const id = match.groups?.id;
    const label = match.groups?.label;
    const start = match.index;
    const end = index + 1 < matches.length ? matches[index + 1].index : content.length;
    if (!id || !label || start === undefined || end === undefined) {
      continue;
    }

    entries.push({
      id,
      label: label.trim(),
      raw: ensureTrailingNewline(content.slice(start, end).trimEnd())
    });
  }

  return entries;
}

export function findMarkdownEntry(content: string, id: string): MarkdownEntry | undefined {
  return parseMarkdownEntries(content).find((entry) => entry.id === id);
}

export function extractSection(entryRaw: string, sectionName: string): string | undefined {
  const normalized = entryRaw.replace(/\r\n/g, "\n");
  const startToken = `### ${sectionName}\n`;
  const startIndex = normalized.indexOf(startToken);
  if (startIndex === -1) {
    return undefined;
  }

  const contentStart = startIndex + startToken.length;
  const nextSectionIndex = normalized.indexOf("\n### ", contentStart);
  const contentEnd = nextSectionIndex === -1 ? normalized.length : nextSectionIndex;
  return normalized.slice(contentStart, contentEnd).trim() || undefined;
}

export function extractMetadataValue(entryRaw: string, label: string): string | undefined {
  const metadataPattern = new RegExp(`^- ${escapeForRegExp(label)}: (.+)$`, "m");
  return entryRaw.match(metadataPattern)?.[1]?.trim();
}

export function extractStatus(entryRaw: string): string | undefined {
  return entryRaw.match(/^\*\*Status\*\*: (.+)$/m)?.[1]?.trim();
}

export function toLearningEntryDetails(entry: MarkdownEntry): LearningEntryDetails {
  return {
    id: entry.id,
    label: entry.label,
    summary: extractSection(entry.raw, "Summary"),
    details: extractSection(entry.raw, "Details"),
    suggestedAction: extractSection(entry.raw, "Suggested Action"),
    status: extractStatus(entry.raw),
    promotedTo: extractMetadataValue(entry.raw, "Promoted-To"),
    skillPath: extractMetadataValue(entry.raw, "Skill-Path")
  };
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
