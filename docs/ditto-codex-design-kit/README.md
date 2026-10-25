# Ditto Codex Design Kit

This kit contains a local installer and a reusable design quality instruction addendum. It does not bundle third-party skill code or install software into your Mac from ChatGPT.

## Install on your Mac
1. Extract this folder.
2. Open Terminal and `cd` to the root of your Ditto Git repository.
3. Run `bash /path/to/extracted/ditto-codex-design-kit/install.sh` (replace the path).
4. Inspect `git status --short`, inspect the installed third-party files before trusting them, then restart Codex.
5. Review `AGENTS_ADDENDUM.md` and append its contents to your repository `AGENTS.md` if appropriate.

Upstreams:
- https://github.com/pbakaus/impeccable
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

The installer uses the upstream public npm CLIs. Third-party code and versions can change; review the repositories and commands before running. Impeccable hooks are disabled by default in this kit for safety. Actual skills are downloaded on the Mac only when the script is run.

If CLI options have changed, use the latest upstream README; do not improvise destructive commands.
