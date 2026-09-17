import { Hono } from "hono";
import { sql } from "drizzle-orm";
import type { ApiEnv } from "./lib/api-env";
import { databaseMiddleware } from "./middlewares/database-middleware";

const app = new Hono<ApiEnv>()
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .use("/api/*", databaseMiddleware)
  .get("/api/health/database", async (c) => {
    await c.var.db.execute(sql`select 1`);
    return c.json({ database: "ok", status: "ok" }, 200);
  });

app.get("/", (c) => c.json({ service: "api", status: "ok" }));

export default app;
