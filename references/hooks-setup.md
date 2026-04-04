# Hook Setup Guide

Configure automatic `self-optimization` reminders for supported coding agents.

## Overview

The included hooks are intentionally lightweight:

- `activator.sh` reminds the agent to capture durable signal after a prompt
- `error-detector.sh` reminds the agent to log meaningful failures after tool use

By default, `activator.sh` prints once per session when a known session id is available.
Otherwise it falls back to a 30-minute workspace cooldown. Override with
`SELF_OPTIMIZATION_REMINDER_COOLDOWN_SECONDS`.

## Claude Code

Project-level `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "fix|debug|error|failure|regression|incident|workaround|retry|flaky",
        "hooks": [
          {
            "type": "command",
            "command": "./skills/self-optimization/scripts/activator.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./skills/self-optimization/scripts/error-detector.sh"
          }
        ]
      }
    ]
  }
}
```

User-level activation:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "fix|debug|error|failure|regression|incident|workaround|retry|flaky",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/skills/self-optimization/scripts/activator.sh"
          }
        ]
      }
    ]
  }
}
```

## Codex

`.codex/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "fix|debug|error|failure|regression|incident|workaround|retry|flaky",
        "hooks": [
          {
            "type": "command",
            "command": "./skills/self-optimization/scripts/activator.sh"
          }
        ]
      }
    ]
  }
}
```

## GitHub Copilot

Copilot has no equivalent hook system, so use repo instructions instead:

```markdown
## Self-Optimization

After debugging non-obvious issues or learning a repeatable project rule:
- log it to `.learnings/`
- link recurring entries
- promote stable patterns into repo guidance
```

## Verification

### Activator

1. Enable the hook.
2. Start a fresh session.
3. Send any prompt.
4. Confirm the context includes `<self-optimization-reminder>`.

### Error Detector

1. Enable the `PostToolUse` Bash hook.
2. Run a failing command.
3. Confirm the context includes `<self-optimization-error>`.

### Extract Script

```bash
./skills/self-optimization/scripts/extract-skill.sh test-skill --dry-run
```

## Troubleshooting

### Permission denied

```bash
chmod +x ./skills/self-optimization/scripts/activator.sh
chmod +x ./skills/self-optimization/scripts/error-detector.sh
chmod +x ./skills/self-optimization/scripts/extract-skill.sh
```

### Script not found

Use an absolute path if your working directory varies:

```json
{
  "command": "/absolute/path/to/skills/self-optimization/scripts/activator.sh"
}
```

### Too much overhead

Use a narrower matcher or increase the reminder cooldown:

```json
{
  "matcher": "debug|error|incident",
  "hooks": []
}
```

```bash
export SELF_OPTIMIZATION_REMINDER_COOLDOWN_SECONDS=3600
```
