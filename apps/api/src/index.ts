import { Hono } from "hono";
import { cors } from "hono/cors";
import { JSONRPCServer } from "json-rpc-2.0";
import { createAuth } from "./lib/auth";
import type { ApiEnv } from "./lib/api-env";
import { databaseMiddleware } from "./middlewares/database-middleware";

type RpcContext = {
  session: Awaited<ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>>;
};

const createRpcServer = (context: RpcContext) => {
  const server = new JSONRPCServer<RpcContext>();

  server.addMethod("health", () => ({ status: "ok" }));
  server.addMethod("auth.getSession", () => context.session);

  return server;
};

const app = new Hono<ApiEnv>();

app.use("/api/*", cors({
  origin: (origin, c) => origin === c.env.SPA_ORIGIN ? origin : c.env.SPA_ORIGIN,
  credentials: true,
}));
app.use("/api/*", databaseMiddleware);

app.all("/api/auth/*", (c) => createAuth(c.var.db, c.env).handler(c.req.raw));

app.post("/api/rpc", async (c) => {
  const auth = createAuth(c.var.db, c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const payload = await c.req.text();
  const response = await createRpcServer({ session }).receiveJSON(payload, { session });

  return response ? c.json(response) : c.body(null, 204);
});

export default app;
