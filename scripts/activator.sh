#!/bin/bash
# Self-Optimization Activator Hook
# Emits a compact reminder after prompt submission.
# Prints once per session when a known session id is available, otherwise
# applies a workspace-scoped cooldown to avoid repeating the reminder every turn.

set -eu

is_positive_integer() {
    [[ "$1" =~ ^[0-9]+$ ]]
}

SESSION_KEY="${CLAUDE_SESSION_ID:-${CODEX_SESSION_ID:-${OPENCLAW_SESSION_KEY:-${SESSION_ID:-}}}}"
COOLDOWN_SECONDS="${SELF_OPTIMIZATION_REMINDER_COOLDOWN_SECONDS:-1800}"
STATE_ROOT="${XDG_STATE_HOME:-${TMPDIR:-/tmp}}/self-optimization"

if ! is_positive_integer "$COOLDOWN_SECONDS"; then
    COOLDOWN_SECONDS=1800
fi

workspace_key="$(pwd -P 2>/dev/null || printf '%s' "${PWD:-unknown-workspace}")"

if [ -n "$SESSION_KEY" ]; then
    scope_key="session:$SESSION_KEY:$workspace_key"
else
    scope_key="workspace:$workspace_key"
fi

if mkdir -p "$STATE_ROOT" 2>/dev/null; then
    scope_hash="$(printf '%s' "$scope_key" | cksum | awk '{print $1}')"
    state_file="$STATE_ROOT/activator-$scope_hash"

    if [ "$COOLDOWN_SECONDS" -gt 0 ] && [ -f "$state_file" ]; then
        last_seen="$(sed -n '1p' "$state_file" 2>/dev/null || true)"
        if is_positive_integer "$last_seen"; then
            now="$(date +%s)"
            age=$((now - last_seen))
            if [ "$age" -lt "$COOLDOWN_SECONDS" ]; then
                exit 0
            fi
        fi
    fi

    date +%s > "$state_file"
fi

cat << 'EOF'
<self-optimization-reminder>
Before finishing, check whether this task produced durable signal:
- correction, missing fact, or new convention
- non-obvious failure or workaround
- repeated friction worth linking or promoting
- missing capability the user asked for

If yes: capture it in .learnings/ and promote stable patterns into agent guidance.
</self-optimization-reminder>
EOF
