---
name: self-optimization
description: "Capture durable lessons from corrections, failures, and repeated work. Use when a task reveals a reusable rule, a recurring problem, or a missing capability that should be logged, promoted into guidance, or extracted into a skill."
metadata:
---

# Self-Optimization

Use this skill to close the loop after real work. The goal is not just to log what went wrong. The goal is to convert signal from mistakes, corrections, and repeated effort into stronger future behavior.

## What This Skill Is For

Use this skill when work reveals something that should remain useful after the current session ends.

- a correction, missing fact, or undocumented convention
- a non-obvious command, tool, or integration failure
- a repeatable workflow improvement
- a missing capability that should become a feature request
- a stable pattern that should be promoted into guidance or extracted into a reusable skill

The value of this skill is that it turns one-off debugging and corrections into durable memory, clearer guidance, and reusable workflows.

## Current Capabilities

This skill is backed by a CLI-first toolkit, so it can help with both reminding and doing.

- `remind`: emits a lightweight self-optimization reminder with session-aware de-duplication and cooldown fallback
- `detect-error`: detects meaningful failures from tool output or exit codes and emits a structured reminder block
- `init`: creates the canonical workspace `.learnings/` inbox
- `log`: appends structured learning, error, and feature entries with generated IDs and timestamps
- `extract-skill`: scaffolds a reusable skill and can prefill it from an existing learning entry
- `doctor`: checks CLI build health, workspace learnings files, hook documentation alignment, and promotion metadata

## How To Use It

In practice, this skill is used in three ways:

1. Let hooks call `remind` and `detect-error` so useful signal is surfaced during normal work.
2. Use `log` to capture durable learnings in workspace `.learnings/`.
3. Use `doctor`, promotion targets, and `extract-skill` to turn proven patterns into guidance or reusable skills.

## Core Loop

1. Detect meaningful signal.
2. Capture it in `.learnings/`.
3. De-duplicate and link related entries.
4. Promote stable patterns into durable guidance.
5. Extract reusable skills when the pattern is broad and proven.

## Quick Reference

| Situation | Action |
|-----------|--------|
| Command, tool, or integration fails unexpectedly | Run `node ./dist/cli.js log --type error ...` |
| User corrects the agent or provides missing facts | Run `node ./dist/cli.js log --type learning ...` |
| A better repeatable approach is discovered | Run `node ./dist/cli.js log --type learning ...` |
| User asks for a missing capability | Run `node ./dist/cli.js log --type feature ...` |
| Same issue keeps reappearing | Link entries, bump priority, and consider promotion |
| Pattern is stable across tasks | Promote to `AGENTS.md`, `CLAUDE.md`, `TOOLS.md`, `SOUL.md`, or `.github/copilot-instructions.md` |
| Pattern is reusable beyond one repo | Run `node ./dist/cli.js extract-skill <skill-name>` |

## Detection Triggers

Capture a learning when any of these happen:

- The first attempt was wrong and needed correction.
- A tool or command failed in a non-obvious way.
- The user revealed a project convention that was not documented.
- The agent discovered a stronger pattern than the one it started with.
- The same workaround or warning has appeared more than once.
- The user asked for a capability the current system does not provide.

Skip noisy one-off trivia. Capture things that would realistically save a future session time, confusion, or rework.

## Log Files

Create a local `.learnings/` directory in the workspace or in the OpenClaw workspace.

```text
.learnings/
├── LEARNINGS.md
├── ERRORS.md
└── FEATURE_REQUESTS.md
```

Use the CLI to create the inbox:

```bash
node ./dist/cli.js init
```

### `LEARNINGS.md`

Use for:

- corrections
- knowledge gaps
- best practices
- project conventions
- improved workflows

### `ERRORS.md`

Use for:

- command failures
- exceptions
- bad tool assumptions
- API or integration breakage

### `FEATURE_REQUESTS.md`

Use for:

- missing tooling
- automation requests
- product gaps
- missing agent behaviors

## ID Format

Use `TYPE-YYYYMMDD-XXX`.

- `LRN` for learning
- `ERR` for error
- `FEAT` for feature request

Examples:

- `LRN-20260401-001`
- `ERR-20260401-002`
- `FEAT-20260401-003`

## Promotion Rules

Promote an entry when it becomes more valuable as guidance than as a historical note.

| Target | Promote When |
|--------|---------------|
| `CLAUDE.md` | Project facts, conventions, or recurring gotchas |
| `AGENTS.md` | Workflow rules, delegation patterns, automation steps |
| `.github/copilot-instructions.md` | Repo guidance that should reach Copilot |
| `TOOLS.md` | Tool quirks, auth requirements, environment gotchas |
| `SOUL.md` | Behavioral or communication rules for OpenClaw sessions |

Promotion checklist:

1. Distill the learning into a short prevention rule.
2. Add it to the right target file.
3. Update the original entry status to `promoted`.
4. Record where it was promoted with `Promoted-To:` or `Skill-Path:`.

## Recurrence And Dedupe

Before creating a new entry for a familiar issue:

1. Search `.learnings/` for a related keyword or `Pattern-Key`.
2. If a related item exists, link it with `See Also`.
3. Increase `Recurrence-Count` and refresh `Last-Seen`.
4. Escalate priority if the pattern is recurring and costly.

Recurring issues often mean one of three things:

- documentation is missing
- automation is missing
- the architecture or workflow is inviting the same failure

## When To Extract A Skill

Extract a reusable skill when the pattern is:

- resolved and trustworthy
- useful across multiple tasks
- non-obvious enough to justify explicit guidance
- portable beyond a single private incident

Use the helper:

```bash
node ./dist/cli.js extract-skill my-new-skill --dry-run
node ./dist/cli.js extract-skill my-new-skill
node ./dist/cli.js extract-skill my-new-skill --from-learning-id LRN-20260405-001 --source-learning-file ../my-workspace/.learnings/LEARNINGS.md
```

By default, extraction writes beside `self-optimization` when the package is installed under a `skills/` root. In a repo checkout, it writes to `./skills` under the package root. Use `--output-dir` to override the destination relative to your current directory.

To prefill from a learning ID, run the command from the workspace that owns `.learnings/LEARNINGS.md` or pass `--source-learning-file` explicitly.

Then customize the generated `SKILL.md` and update the original learning entry with:

- `Status: promoted_to_skill`
- `Skill-Path: use the installed skill path reported by the extractor`

## Review Rhythm

Review `.learnings/` at these checkpoints:

- before major tasks
- after finishing a feature or bugfix
- when working in an area with previous failures
- during periodic maintenance

Useful checks:

```bash
node ./dist/cli.js doctor
```

## OpenClaw Setup

OpenClaw works especially well with this skill because workspace files and hooks let the improvement loop stay visible between sessions.

### Install

```bash
clawdhub install self-optimization
```

Manual install:

```bash
git clone <your-fork-or-source-repo> ~/.openclaw/skills/self-optimization
```

If you are working from source, build the CLI once:

```bash
npm ci
npm run build
```

### Hook Setup

Optional bootstrap reminder:

```bash
cp -r hooks/openclaw ~/.openclaw/hooks/self-optimization
openclaw hooks enable self-optimization
```

### Workspace Layout

```text
~/.openclaw/workspace/
├── AGENTS.md
├── SOUL.md
├── TOOLS.md
├── MEMORY.md
├── memory/
└── .learnings/
    ├── LEARNINGS.md
    ├── ERRORS.md
    └── FEATURE_REQUESTS.md
```

## Hook Support For Other Agents

### Claude Code / Codex

Use CLI commands in settings:

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "fix|debug|error|failure|regression|incident|workaround|retry|flaky",
      "hooks": [{
        "type": "command",
        "command": "node ./skills/self-optimization/dist/cli.js remind"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "node ./skills/self-optimization/dist/cli.js detect-error"
      }]
    }]
  }
}
```

### GitHub Copilot

Add a reminder to `.github/copilot-instructions.md`:

```markdown
## Self-Optimization

After solving non-obvious issues, consider:
1. Logging the lesson to `.learnings/`
2. Linking related recurring entries
3. Promoting stable rules into repo guidance
4. Extracting reusable skills when the pattern is broad
```

## Best Practices

1. Log signal, not noise.
2. Prefer prevention rules over postmortems.
3. Link related incidents instead of duplicating them.
4. Promote broadly useful guidance quickly.
5. Treat repeated friction as a systems problem, not just a note-taking problem.
6. Review learnings before repeating the same class of work.
