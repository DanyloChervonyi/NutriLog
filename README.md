# NutriLog

NutriLog is a nutrition tracking platform. Product requirements and the data model are documented in `docs/`.

## Repository layout

- `apps/web` - Next.js App Router client (TypeScript)
- `apps/api` - NestJS REST API (TypeScript)
- `docs` - product specification and database diagrams

## Workspace

This repository uses pnpm workspaces. Use Node.js 24 or later and pnpm 10.33.0.

1. Copy `.env.example` to `.env` and replace secret placeholders with unique random values (hexadecimal values work in database URLs without extra escaping).
2. Run `pnpm install` from the repository root.
3. Start local services with `docker compose up -d postgres redis`.
4. Run `pnpm dev:api` and `pnpm dev:web` in separate terminals.

The API health endpoint is `http://localhost:4000/api/v1/health`; development API docs are at `http://localhost:4000/api/docs`.

## Security baseline

- Secret-bearing `.env` files are ignored by Git; only `.env.example` is tracked.
- API responses use Helmet security headers, strict CORS origins, request validation, and global rate limiting.
- The web app disables its framework signature and sets browser security headers. HSTS is sent only in production.
- Passwords, tokens, and database credentials must never be committed.

## MVP scope

See [docs/MVP-SCOPE.md](docs/MVP-SCOPE.md) for the agreed first release scope and completion criteria.
