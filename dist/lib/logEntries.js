import { parseMarkdownEntries } from "./markdown.js";
import { ensureTrailingNewline, normalizeHeadingToken } from "./utils.js";
const ID_PREFIXES = {
    learning: "LRN",
    error: "ERR",
    feature: "FEAT"
};
export function buildNextEntryId(type, existingContent, now) {
    const prefix = ID_PREFIXES[type];
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
    const pattern = new RegExp(`${prefix}-${dateStamp}-(\\d{3})`);
    let maxSequence = 0;
    for (const entry of parseMarkdownEntries(existingContent)) {
        const match = entry.id.match(pattern);
        if (!match || !match[1]) {
            continue;
        }
        maxSequence = Math.max(maxSequence, Number.parseInt(match[1], 10));
    }
    return `${prefix}-${dateStamp}-${String(maxSequence + 1).padStart(3, "0")}`;
}
export function formatLogEntry(id, input, now) {
    const logged = now.toISOString();
    const priority = input.priority || "medium";
    const metadataLines = buildMetadataLines(input);
    if (input.type === "learning") {
        return ensureTrailingNewline(`## [${id}] ${normalizeHeadingToken(input.category)}

**Logged**: ${logged}
**Priority**: ${priority}
**Status**: pending
**Area**: ${input.area}

### Summary
${input.summary}

### Details
${input.details}

### Suggested Action
${input.suggestedAction}
${formatMetadataSection(metadataLines)}
---
`);
    }
    if (input.type === "error") {
        return ensureTrailingNewline(`## [${id}] ${normalizeHeadingToken(input.tool)}

**Logged**: ${logged}
**Priority**: ${priority}
**Status**: pending
**Area**: ${input.area}

### Summary
${input.summary}

### Error
\`\`\`text
${input.errorText}
\`\`\`

### Context
- Tool or command: ${input.tool}

### Suggested Fix
${input.suggestedFix}
${formatMetadataSection(metadataLines)}
---
`);
    }
    return ensureTrailingNewline(`## [${id}] ${normalizeHeadingToken(input.capability)}

**Logged**: ${logged}
**Priority**: ${priority}
**Status**: pending
**Area**: ${input.area}

### Requested Capability
${input.capability}

### User Context
${input.userContext}

### Complexity Estimate
${input.complexity}

### Suggested Implementation
${input.suggestedImplementation}
${formatMetadataSection(metadataLines)}
---
`);
}
function buildMetadataLines(input) {
    const lines = [];
    if (input.type === "learning" && input.source) {
        lines.push(`- Source: ${input.source}`);
    }
    if (input.type === "learning" && input.patternKey) {
        lines.push(`- Pattern-Key: ${input.patternKey}`);
    }
    if (input.type === "error" && input.reproducible) {
        lines.push(`- Reproducible: ${input.reproducible}`);
    }
    if (input.type === "feature" && input.frequency) {
        lines.push(`- Frequency: ${input.frequency}`);
    }
    for (const relatedFile of input.relatedFiles || []) {
        lines.push(`- Related Files: ${relatedFile}`);
    }
    if (input.tags?.length) {
        lines.push(`- Tags: ${input.tags.join(", ")}`);
    }
    if (input.seeAlso?.length) {
        lines.push(`- See Also: ${input.seeAlso.join(", ")}`);
    }
    return lines;
}
function formatMetadataSection(lines) {
    if (!lines.length) {
        return "";
    }
    return `

### Metadata
${lines.join("\n")}
`;
}
