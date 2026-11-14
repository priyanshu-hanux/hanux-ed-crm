# CRM server

Express 5 + PostgreSQL + Prisma 7, written in TypeScript (ESM).

## Getting started

```bash
cp .env.example .env     # then adjust if needed
npm install              # also runs `prisma generate`
npm run db:up            # starts Postgres in Docker (docker-compose.yml)
npm run db:migrate       # creates/applies migrations
npm run dev              # http://localhost:5000, restarts on change
```

Check it is up: `GET /health` returns 200 when the database is reachable, 503 when it is not.

## Scripts

| Script | What it does |
|---|---|
| `dev` | Run `src/server.ts` with tsx in watch mode |
| `serve` | Same without watch mode (used by the Claude preview in `.claude/launch.json`) |
| `build` / `start` | Compile to `dist/` and run it |
| `test` / `test:watch` | Vitest + Supertest. Uses `.env.test` if present, otherwise `.env`; tests create `@example.test` users and delete them afterwards |
| `typecheck`, `lint`, `format` | tsc, ESLint, Prettier |
| `db:up` / `db:down` | Start / stop the Postgres container |
| `db:generate` | Regenerate the Prisma client into `src/generated/prisma` |
| `db:migrate` | `prisma migrate dev` (development) |
| `db:deploy` | `prisma migrate deploy` (production) |
| `db:studio` | Open Prisma Studio |
| `platform:admin` | Grant, revoke or list Platform Admins (Hanux staff): `npm run platform:admin -- grant someone@hanux.com "Name"`. Not available through the API on purpose. In production: `node dist/scripts/platform-admin.js grant …` |

## Layout

```
server/
├── prisma.config.ts        Prisma CLI config (schema path, migrations, DATABASE_URL)
├── prisma/schema.prisma    Data model
├── docker-compose.yml      Local Postgres
└── src/
    ├── server.ts           Entry point: starts HTTP server, graceful shutdown
    ├── app.ts              createApp(): middleware stack and route mounting
    ├── config/env.ts       Environment variables, validated with zod at startup
    ├── lib/                Singletons: prisma client, pino logger
    ├── middleware/         validate (zod), not-found, error-handler
    ├── utils/              HttpError, response helpers
    ├── routes/index.ts     /v1 router: register feature modules here
    ├── modules/<feature>/  One folder per feature (routes, controller, service, schemas)
    └── generated/prisma    Generated Prisma client (gitignored)
```

## Conventions

- **Modules.** Each feature lives in `src/modules/<feature>/`:
  `<feature>.routes.ts` (router), `<feature>.controller.ts` (req/res),
  `<feature>.service.ts` (business logic, Prisma calls) and `<feature>.schemas.ts` (zod).
  Mount the router in `src/routes/index.ts`.
- **Imports** from `src/` use the `@/` alias with a `.js` extension (Node ESM), e.g.
  `import { env } from "@/config/env.js"`. tsx resolves the alias in dev; `npm run build`
  runs `tsc-alias` to rewrite it to relative paths in `dist/`.
- **Errors.** Throw `HttpError` (e.g. `HttpError.notFound()`); async handlers can just throw,
  Express 5 forwards rejected promises. Zod and common Prisma errors (unique conflict, not found)
  are mapped to 400 / 409 / 404 by the error handler.
- **Responses** follow `client/src/types/api-response.ts`:
  `{ success, data, message? }`, or `{ success, data, pagination }` via `sendPaginated`.
  Errors are `{ success: false, message, error? }`.
- **Routes** are served under `/v1`, matching what the client calls (`${baseUrl}/v1/...`).
  Point the client's `VITE_*_URL` variables at `http://localhost:5000`.
