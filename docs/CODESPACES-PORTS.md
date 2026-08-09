# Codespaces preview ports

ELSYSTAR uses a small reverse proxy in development to keep Next.js Server Actions stable behind GitHub Codespaces.

Public preview endpoints:
- `6300` — public website
- `6301` — admin panel

Internal upstream endpoints:
- `16300` — public Next.js dev server
- `16301` — admin Next.js dev server

Internal ports should not be used for normal preview links and are configured with `onAutoForward: ignore`.
