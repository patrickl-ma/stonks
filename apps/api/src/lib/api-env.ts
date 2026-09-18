import type { createDb } from "../middlewares/database-middleware";

type Database = Awaited<ReturnType<typeof createDb>>;

export type { Database };

export type ApiEnv = {
  Bindings: CloudflareBindings & {
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    SPA_ORIGIN: string;
  };
  Variables: {
    db: Database;
  };
};
