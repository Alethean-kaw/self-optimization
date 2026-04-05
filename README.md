# Self-Optimization

`self-optimization` is a CLI-first skill package for turning real work into durable improvements.

It helps an agent or team move beyond one-off note taking by capturing meaningful lessons, linking recurring incidents, promoting stable rules into guidance files, and extracting reusable skills when patterns are proven.

## What It Does

- captures corrections, knowledge gaps, and better approaches
- records non-obvious command and tool failures
- tracks missing capabilities as feature requests
- links repeated incidents with stable metadata
- promotes proven patterns into durable workspace or repo guidance
- supports extracting reusable skills from repeated learnings

## Current Capabilities

This project is now a CLI-first self-optimization toolkit for OpenClaw, Codex, Claude Code, and similar agent workflows.

- `remind`: emits a lightweight self-optimization reminder at the right time, with session-aware de-duplication and cooldown fallback to avoid noisy repetition
- `detect-error`: detects meaningful failures from tool output or exit codes and emits a structured reminder block for logging recurring issues
- `init`: creates a canonical workspace `.learnings/` inbox with `LEARNINGS.md`, `ERRORS.md`, and `FEATURE_REQUESTS.md`
- `log`: appends structured learning, error, and feature entries with generated IDs and timestamps
- `extract-skill`: scaffolds reusable skills from proven patterns and can prefill content from an existing learning entry
- `doctor`: checks CLI build status, workspace learnings files, hook documentation alignment, and promotion metadata health

Together, these commands support the full loop from "something important happened during work" to "this lesson is now reusable guidance or a reusable skill."

## Core Loop

1. Detect meaningful signal during work.
2. Capture it in `.learnings/`.
3. De-duplicate and connect related entries.
4. Promote stable rules into guidance files.
5. Extract reusable skills when a pattern becomes portable.

## Directory Layout

```text
self-optimization/
├── .learnings/
│   ├── ERRORS.md
│   ├── FEATURE_REQUESTS.md
│   └── LEARNINGS.md
├── assets/
│   ├── LEARNINGS.md
│   └── SKILL-TEMPLATE.md
├── dist/
│   └── cli.js
├── hooks/
│   └── openclaw/
│       ├── handler.js
│       ├── handler.ts
│       └── HOOK.md
├── references/
│   ├── examples.md
│   ├── hooks-setup.md
│   └── openclaw-integration.md
├── src/
├── tests/
├── tools/
├── package.json
├── README.md
├── SKILL.md
├── tsconfig.json
└── _meta.json
```

## Official CLI

From the package root:

```bash
node ./dist/cli.js remind
node ./dist/cli.js detect-error
node ./dist/cli.js init
node ./dist/cli.js doctor
node ./dist/cli.js extract-skill my-new-skill --dry-run
```

`log` is the structured entrypoint for writing new learnings:

```bash
node ./dist/cli.js log --type learning \
  --category best_practice \
  --summary "Prefer CLI-first hooks" \
  --details "The package now uses node ./dist/cli.js instead of shell scripts." \
  --suggested-action "Point setup guides at the CLI entrypoints." \
  --area docs
```

## Quick Start

### Install In OpenClaw

```bash
clawdhub install self-optimization
```

Or install manually:

```bash
cp -r self-optimization ~/.openclaw/skills/
```

If you are working from source, build the CLI once:

```bash
npm ci
npm run build
```

### Create The Learning Inbox

Use the workspace as the canonical `.learnings/` location:

```bash
node ./dist/cli.js init
```

### Check The Installation

```bash
node ./dist/cli.js doctor
```

### Optional Hook

```bash
cp -r hooks/openclaw ~/.openclaw/hooks/self-optimization
openclaw hooks enable self-optimization
```

For Claude Code, Codex, and related hook setups, use the CLI commands documented in [references/hooks-setup.md](./references/hooks-setup.md).

## Skill Extraction

When a pattern is repeatable and broadly useful, scaffold a new skill:

```bash
node ./dist/cli.js extract-skill my-new-skill --dry-run
node ./dist/cli.js extract-skill my-new-skill
node ./dist/cli.js extract-skill my-new-skill --from-learning-id LRN-20260405-001 --source-learning-file ../my-workspace/.learnings/LEARNINGS.md
```

By default, extraction writes beside `self-optimization` when the package is installed under a `skills/` root. In a repo checkout, it writes to `./skills` under the package root. Use `--output-dir` to override the destination relative to your current directory.

When you prefill from a learning ID, run the command from the workspace that owns `.learnings/LEARNINGS.md` or pass `--source-learning-file` explicitly.

## Promotion Targets

Promote stable lessons out of `.learnings/` when they become rules:

- `CLAUDE.md` for project facts and conventions
- `AGENTS.md` for workflows and delegation patterns
- `TOOLS.md` for tool behavior and environment gotchas
- `SOUL.md` for behavioral rules in OpenClaw workspaces
- `.github/copilot-instructions.md` for Copilot-facing repo guidance

Record promotion targets explicitly in the learning metadata with `Promoted-To:` or `Skill-Path:`.

## Supporting Files

- [SKILL.md](./SKILL.md): main skill definition and operating model
- [references/examples.md](./references/examples.md): concrete examples for learnings, errors, feature requests, promotion, and skill extraction
- [references/openclaw-integration.md](./references/openclaw-integration.md): OpenClaw installation and workspace integration
- [references/hooks-setup.md](./references/hooks-setup.md): hook configuration for Claude Code, Codex, and related setups
- [assets/LEARNINGS.md](./assets/LEARNINGS.md): stronger learning template
- [assets/SKILL-TEMPLATE.md](./assets/SKILL-TEMPLATE.md): template for extracted skills

## Development

```bash
npm ci
npm test
npm run build
```

CI runs the same steps on Windows and Ubuntu.

## Design Goal

This package is designed to make improvement operational:

- not just "remember this"
- but "capture it, connect it, promote it, and reuse it"
