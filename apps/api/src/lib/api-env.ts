import type { createDb } from "../middlewares/database-middleware";

type Database = Awaited<ReturnType<typeof createDb>>;

export type ApiEnv = {
  Bindings: CloudflareBindings;
  Variables: {
    db: Database;
  };
};
