export const REMINDER_BLOCK = `<self-optimization-reminder>
Before finishing, check whether this task produced durable signal:
- correction, missing fact, or new convention
- non-obvious failure or workaround
- repeated friction worth linking or promoting
- missing capability the user asked for

If yes: capture it in .learnings/ and promote stable patterns into agent guidance.
</self-optimization-reminder>
`;
export const ERROR_BLOCK = `<self-optimization-error>
Meaningful failure detected. If it required investigation or may recur:
- log it to .learnings/ERRORS.md
- link related incidents
- promote stable fixes into repo guidance

Use the error format: [ERR-YYYYMMDD-XXX]
</self-optimization-error>
`;
export const LEARNINGS_FILES = [
    "LEARNINGS.md",
    "ERRORS.md",
    "FEATURE_REQUESTS.md"
];
export const VALID_AREAS = [
    "frontend",
    "backend",
    "infra",
    "tests",
    "docs",
    "config"
];
export const VALID_PRIORITIES = [
    "low",
    "medium",
    "high",
    "critical"
];
export const VALID_COMPLEXITIES = [
    "simple",
    "medium",
    "complex"
];
export const VALID_REPRODUCIBLE = [
    "yes",
    "no",
    "unknown"
];
export const VALID_FREQUENCIES = [
    "first_time",
    "recurring"
];
export const HOOK_REMIND_COMMAND = "node ./skills/self-optimization/dist/cli.js remind";
export const HOOK_DETECT_COMMAND = "node ./skills/self-optimization/dist/cli.js detect-error";
export const MATCHING_PROMPT_NOTE = "Use a prompt that matches the configured `matcher`";
export const EMPTY_MATCHER_NOTE = "temporarily set `matcher` to `\"\"`";
