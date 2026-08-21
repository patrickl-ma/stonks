# stonks

## Repo layout
`apps/` contains stuff we run. `packages/` contains supporting libraries and schema defs that might be used by multiple packages in `apps/`

### apps
- marketing: astro-powered landing and marketing pages
- spa: vite + react. the actual 
- api: the fastify api that the spa will connect to
- worker: (future) ETL worker
### packages
- db: database schema defs using drizzle.

## Commands

```bash
cp .env.example .env
openssl rand -base64 32
# Paste the generated value into BETTER_AUTH_SECRET in .env
pnpm db:up
pnpm db:migrate
```

The API validates `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and
`SPA_ORIGIN` at startup. `BETTER_AUTH_SECRET` must be at least 32 characters.

Start the Fastify backend (available at http://localhost:3001):

```bash
pnpm --filter api dev
```

Start the Astro marketing app (available at http://localhost:4321):

```bash
pnpm --filter marketing dev
```

Start the Vite React app (available at http://localhost:5173):

```bash
pnpm --filter spa dev
```

Start all three packages concurrently (requires `concurrently`):

```bash
pnpm dev
```
