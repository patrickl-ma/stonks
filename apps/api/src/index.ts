import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./lib/auth";
import type { ApiEnv } from "./lib/api-env";
import { databaseMiddleware } from "./middlewares/database-middleware";

type RpcId = string | number | null;
type RpcRequest = {
  jsonrpc: "2.0";
  id?: RpcId;
  method: string;
  params?: Record<string, unknown>;
};

type RpcResponse = {
  jsonrpc: "2.0";
  id: RpcId;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
};

const invalidRequest = (id: RpcId = null): RpcResponse => ({
  jsonrpc: "2.0",
  id,
  error: { code: -32600, message: "Invalid Request" },
});

const handleRpcRequest = async (
  request: unknown,
  session: Awaited<ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>>,
): Promise<RpcResponse> => {
  if (
    typeof request !== "object" ||
    request === null ||
    (request as { jsonrpc?: unknown }).jsonrpc !== "2.0" ||
    typeof (request as { method?: unknown }).method !== "string"
  ) {
    return invalidRequest();
  }

  const rpcRequest = request as RpcRequest;
  const id = rpcRequest.id ?? null;

  switch (rpcRequest.method) {
    case "health":
      return { jsonrpc: "2.0", id, result: { status: "ok" } };
    case "auth.getSession":
      return { jsonrpc: "2.0", id, result: session };
    default:
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${rpcRequest.method}`,
        },
      };
  }
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
  const payload: unknown = await c.req.json().catch(() => null);

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return c.json([invalidRequest()], 200);
    }

    return c.json(await Promise.all(payload.map((request) => handleRpcRequest(request, session))), 200);
  }

  return c.json(await handleRpcRequest(payload, session), 200);
});

export default app;
