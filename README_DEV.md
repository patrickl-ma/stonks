# Development README

Run the following at the repo root to install dependencies:

```bash
pnpm install
```

Dev commands:

```bash
# Start Fastify backend only
pnpm --filter api dev

# Start marketing only
pnpm --filter marketing dev

# Start Vite React app only
pnpm --filter spa dev

# Start all three packages (requires `concurrently`)
pnpm dev
```
