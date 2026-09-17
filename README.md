# stonks

## Repo layout
`apps/` contains stuff we run. `packages/` contains supporting libraries and schema defs that might be used by multiple packages in `apps/`

### apps
- marketing: astro-powered landing and marketing pages
- spa: vite + react. the actual 
- api: a Hono API deployed as a Cloudflare Worker
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

Start the Hono Worker API (available at http://localhost:8787):

```bash
pnpm dev:api
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

Deploy the API after creating its Hyperdrive binding:

```bash
pnpm deploy:api
```
