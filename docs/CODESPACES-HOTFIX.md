# Codespaces hotfix notes

For the current preview workflow, `git pull && bash .devcontainer/start-preview.sh` performs a clean restart against the current `main` revision.

The script intentionally restarts both Next.js apps instead of reusing an already-listening process because Server Action/Turbopack manifests are revision-dependent.

GitHub Codespaces forwarded domains (`*.app.github.dev`) are explicitly allowed as development and Server Action origins in both Next.js apps.
