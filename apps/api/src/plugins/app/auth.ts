import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth, type BetterAuthOptions } from 'better-auth'
import fp from 'fastify-plugin'
import * as schema from '@stonks/db/schema'

const buildAuth = (
  db: import('fastify').FastifyInstance['db'],
  config: import('fastify').FastifyInstance['config'],
) => {
  const database: NonNullable<BetterAuthOptions['database']> = drizzleAdapter(db, {
    provider: 'pg',
    schema,
  })

  const authOptions = {
    appName: 'Stonks',
    database,
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_URL,
    trustedOrigins: [config.SPA_ORIGIN],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
  } satisfies BetterAuthOptions

  return betterAuth(authOptions)
}

export type StonksAuth = ReturnType<typeof buildAuth>

declare module 'fastify' {
  interface FastifyInstance {
    auth: StonksAuth
  }
}

export default fp(async function authPlugin(fastify) {
  fastify.decorate('auth', buildAuth(fastify.db, fastify.config))
}, {
  name: 'auth',
  dependencies: ['env', 'database'],
})
