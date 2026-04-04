#!/bin/bash
# Skill Extraction Helper
# Creates a new skill scaffold from a learning entry
# Usage: ./extract-skill.sh <skill-name> [--dry-run]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd -P)"
DEFAULT_SKILLS_DIR="$(cd "$PACKAGE_DIR/.." && pwd -P)"
CURRENT_DIR="$(pwd -P)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    cat << EOF
Usage: $(basename "$0") <skill-name> [options]

Create a new skill scaffold from a learning entry.

Arguments:
  skill-name     Name of the skill (lowercase, hyphens for spaces)

Options:
  --dry-run      Show what would be created without creating files
  --output-dir   Relative output directory under current path (override the default skills root)
  -h, --help     Show this help message

Examples:
  $(basename "$0") docker-m1-fixes
  $(basename "$0") api-timeout-patterns --dry-run
  $(basename "$0") pnpm-setup --output-dir ./skills/custom

By default the skill will be created beside this package in:
  $DEFAULT_SKILLS_DIR/<skill-name>/

Use --output-dir to override the location relative to your current directory:
  $CURRENT_DIR/<relative-output-dir>/<skill-name>/
EOF
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Parse arguments
SKILL_NAME=""
DRY_RUN=false
OUTPUT_DIR_OVERRIDE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --output-dir)
            if [ -z "${2:-}" ] || [[ "${2:-}" == -* ]]; then
                log_error "--output-dir requires a relative path argument"
                usage
                exit 1
            fi
            OUTPUT_DIR_OVERRIDE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
        *)
            if [ -z "$SKILL_NAME" ]; then
                SKILL_NAME="$1"
            else
                log_error "Unexpected argument: $1"
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate skill name
if [ -z "$SKILL_NAME" ]; then
    log_error "Skill name is required"
    usage
    exit 1
fi

# Validate skill name format (lowercase, hyphens, no spaces)
if ! [[ "$SKILL_NAME" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
    log_error "Invalid skill name format. Use lowercase letters, numbers, and hyphens only."
    log_error "Examples: 'docker-fixes', 'api-patterns', 'pnpm-setup'"
    exit 1
fi

if [ -n "$OUTPUT_DIR_OVERRIDE" ]; then
    # Validate override path to avoid writes outside current workspace.
    if [[ "$OUTPUT_DIR_OVERRIDE" = /* ]]; then
        log_error "Output directory must be a relative path under the current directory."
        exit 1
    fi

    if [[ "$OUTPUT_DIR_OVERRIDE" =~ (^|/)\.\.(/|$) ]]; then
        log_error "Output directory cannot include '..' path segments."
        exit 1
    fi

    OUTPUT_DIR_OVERRIDE="${OUTPUT_DIR_OVERRIDE#./}"
    SKILLS_DIR="$CURRENT_DIR/$OUTPUT_DIR_OVERRIDE"
else
    SKILLS_DIR="$DEFAULT_SKILLS_DIR"
fi

SKILLS_DIR="${SKILLS_DIR%/}"

SKILL_PATH="$SKILLS_DIR/$SKILL_NAME"

# Check if skill already exists
if [ -d "$SKILL_PATH" ] && [ "$DRY_RUN" = false ]; then
    log_error "Skill already exists: $SKILL_PATH"
    log_error "Use a different name or remove the existing skill first."
    exit 1
fi

# Dry run output
if [ "$DRY_RUN" = true ]; then
    log_info "Dry run - would create:"
    echo "  $SKILL_PATH/"
    echo "  $SKILL_PATH/SKILL.md"
    echo ""
    echo "Template content would be:"
    echo "---"
    cat << TEMPLATE
name: $SKILL_NAME
description: "[TODO: Add a concise description of what this skill does and when to use it]"
---

# $(echo "$SKILL_NAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')

[TODO: Brief introduction explaining the skill's purpose]

## Quick Reference

| Situation | Action |
|-----------|--------|
| [Trigger condition] | [What to do] |

## Usage

[TODO: Detailed usage instructions]

## Examples

[TODO: Add concrete examples]

## Source Learning

This skill was extracted from a learning entry.
- Learning ID: [TODO: Add original learning ID]
- Original File: [TODO: Add original learning file path]
TEMPLATE
    echo "---"
    exit 0
fi

# Create skill directory structure
log_info "Creating skill: $SKILL_NAME"

mkdir -p "$SKILL_PATH"

# Create SKILL.md from template
cat > "$SKILL_PATH/SKILL.md" << TEMPLATE
---
name: $SKILL_NAME
description: "[TODO: Add a concise description of what this skill does and when to use it]"
---

# $(echo "$SKILL_NAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')

[TODO: Brief introduction explaining the skill's purpose]

## Quick Reference

| Situation | Action |
|-----------|--------|
| [Trigger condition] | [What to do] |

## Usage

[TODO: Detailed usage instructions]

## Examples

[TODO: Add concrete examples]

## Source Learning

This skill was extracted from a learning entry.
- Learning ID: [TODO: Add original learning ID]
- Original File: [TODO: Add original learning file path]
TEMPLATE

log_info "Created: $SKILL_PATH/SKILL.md"

# Suggest next steps
echo ""
log_info "Skill scaffold created successfully!"
echo ""
    echo "Next steps:"
    echo "  1. Edit $SKILL_PATH/SKILL.md"
    echo "  2. Fill in the TODO sections with the stable rule or workflow"
    echo "  3. Add references/ folder if you have detailed documentation"
    echo "  4. Add scripts/ folder if you have executable code"
    echo "  5. Update the original learning entry with:"
    echo "     **Status**: promoted_to_skill"
    echo "     **Skill-Path**: $SKILL_PATH"
