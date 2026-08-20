# stonks

## Development

Install dependencies at the repo root:

```bash
pnpm install
```

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

Verify the API health endpoint:

```bash
curl http://localhost:3001/health
# { "status": "ok" }
```
