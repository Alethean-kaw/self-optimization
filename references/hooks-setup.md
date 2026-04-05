# Hook Setup Guide

Configure automatic `self-optimization` reminders for supported coding agents.

## Overview

The included hooks are intentionally lightweight:

- `node ./skills/self-optimization/dist/cli.js remind` nudges the agent to capture durable signal after a matching prompt
- `node ./skills/self-optimization/dist/cli.js detect-error` nudges the agent to log meaningful failures after tool use

`remind` prints once per session when a known session id is available. Otherwise it falls back to a 30-minute workspace cooldown. Override with `SELF_OPTIMIZATION_REMINDER_COOLDOWN_SECONDS`.

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
            "command": "node ./skills/self-optimization/dist/cli.js remind"
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
            "command": "node ./skills/self-optimization/dist/cli.js detect-error"
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
            "command": "node ~/.claude/skills/self-optimization/dist/cli.js remind"
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
            "command": "node ./skills/self-optimization/dist/cli.js remind"
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
            "command": "node ./skills/self-optimization/dist/cli.js detect-error"
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

### Reminder Hook

1. Enable the hook.
2. Start a fresh session.
3. Use a prompt that matches the configured `matcher`, for example `debug the flaky checkout timeout`.
4. Confirm the context includes `<self-optimization-reminder>`.
5. If you want to test with any prompt, temporarily set `matcher` to `""`.

### Error Detector

1. Enable the `PostToolUse` Bash hook.
2. Run a failing command.
3. Confirm the context includes `<self-optimization-error>`.

### Extract Skill

```bash
node ./dist/cli.js extract-skill test-skill --dry-run
```

## Troubleshooting

### CLI not built

```bash
npm ci
npm run build
```

### Command path issues

Use an absolute path if your working directory varies:

```json
{
  "command": "node /absolute/path/to/skills/self-optimization/dist/cli.js remind"
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
