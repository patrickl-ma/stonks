```txt
npm install
npm run dev
```

For local development, copy `.env.example` to `.env` and set the direct Neon
connection string in
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`. Wrangler uses that
value to emulate the `HYPERDRIVE` binding locally; the connection string does
not belong in `wrangler.jsonc`.

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
