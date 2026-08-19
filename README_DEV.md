# Development README

Run the following at the repo root to install dependencies:

```bash
pnpm install
```

Dev commands:

```bash
# Start API only
pnpm --filter packages/api dev

# Start web only
pnpm --filter apps/web dev

# Start both (requires `concurrently`)
pnpm dev
```
