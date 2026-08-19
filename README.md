# stonks

## Development

Install dependencies at the repo root:

```bash
pnpm install
```

Start the Fastify API (available at http://localhost:3001):

```bash
pnpm --filter ./packages/api dev
```

Start the Astro web app (available at http://localhost:4321):

```bash
pnpm --filter ./apps/web dev
```

Start both concurrently (requires `concurrently`):

```bash
pnpm dev
```

Verify the API health endpoint:

```bash
curl http://localhost:3001/health
# { "status": "ok" }
```
