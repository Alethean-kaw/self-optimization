#!/bin/bash
# Self-Optimization Error Detector Hook
# Emits a reminder when tool output looks like a meaningful failure.
# Uses conservative heuristics to avoid firing on success summaries such as
# "42 passed, 0 failed".

set -eu

first_non_empty() {
    for value in "$@"; do
        if [ -n "$value" ]; then
            printf '%s' "$value"
            return 0
        fi
    done
    return 1
}

RAW_OUTPUT="$(first_non_empty "${CLAUDE_TOOL_OUTPUT:-}" "${CODEX_TOOL_OUTPUT:-}" "${TOOL_OUTPUT:-}" || true)"
if [ -z "$RAW_OUTPUT" ]; then
    exit 0
fi

OUTPUT="$(printf '%s' "$RAW_OUTPUT" | tr '[:upper:]' '[:lower:]')"
EXIT_CODE="$(first_non_empty "${CLAUDE_TOOL_EXIT_CODE:-}" "${CODEX_TOOL_EXIT_CODE:-}" "${TOOL_EXIT_CODE:-}" "${EXIT_CODE:-}" || true)"

has_nonzero_exit=false
if [[ "$EXIT_CODE" =~ ^-?[0-9]+$ ]] && [ "$EXIT_CODE" -ne 0 ]; then
    has_nonzero_exit=true
fi

STRONG_ERROR_PATTERNS=(
    "error:"
    "fatal:"
    "command not found"
    "no such file"
    "permission denied"
    "exception"
    "traceback"
    "npm err!"
    "modulenotfounderror"
    "module not found"
    "syntaxerror"
    "typeerror"
    "timed out"
    "segmentation fault"
)

contains_error=false
for pattern in "${STRONG_ERROR_PATTERNS[@]}"; do
    if [[ "$OUTPUT" == *"$pattern"* ]]; then
        contains_error=true
        break
    fi
done

if [ "$contains_error" = false ]; then
    if printf '%s\n' "$OUTPUT" | grep -Eq '(^|[^0-9])([1-9][0-9]*) failed\b|\bfailed to\b|\bfailed with\b|\bfailures?: [1-9][0-9]*\b|\berrors?: [1-9][0-9]*\b|\bexit code [1-9][0-9]*\b|\bexited with code [1-9][0-9]*\b|\bnon-zero exit\b'; then
        contains_error=true
    fi
fi

if [ "$contains_error" = false ] && [ "$has_nonzero_exit" = true ]; then
    if printf '%s\n' "$OUTPUT" | grep -Eq '\berror\b|\bfatal\b|\bfail(?:ed|ure)?\b|\bexception\b|\btraceback\b'; then
        contains_error=true
    fi
fi

if [ "$contains_error" = true ]; then
    cat << 'EOF'
<self-optimization-error>
Meaningful failure detected. If it required investigation or may recur:
- log it to .learnings/ERRORS.md
- link related incidents
- promote stable fixes into repo guidance

Use the error format: [ERR-YYYYMMDD-XXX]
</self-optimization-error>
EOF
fi
