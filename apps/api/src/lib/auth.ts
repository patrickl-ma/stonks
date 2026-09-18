import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import type { Database } from "../lib/api-env";
import { authSchema } from "@stonks/db/schema";

type AuthEnvironment = {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  SPA_ORIGIN: string;
};

export function createAuth(db: Database, env: AuthEnvironment) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.SPA_ORIGIN],
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      useSecureCookies: env.BETTER_AUTH_URL.startsWith("https://"),
    },
  });
}
