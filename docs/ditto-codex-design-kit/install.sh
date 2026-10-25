#!/usr/bin/env bash
set -euo pipefail
if [[ ! -f package.json || ! -d .git ]]; then
  echo 'Run this from the root of your Ditto Git repository (package.json and .git required).' >&2
  exit 1
fi
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo 'Node.js and npm are required. Install them first.' >&2
  exit 1
fi
mkdir -p docs/design-system
printf '\nInstalling UI/UX Pro Max into this project for Codex...\n'
npx --yes ui-ux-pro-max-cli init --ai codex
printf '\nInstalling Impeccable project skill (without automatic hooks)...\n'
npx --yes impeccable install --providers=codex --scope=project --no-hooks
printf '\nInstallation commands finished. Restart Codex and verify the skills are listed.\n'
printf 'Review generated files with: git status --short\n'
printf 'For Impeccable hooks, read upstream security notes and opt in separately.\n'
