import fastifyEnv from '@fastify/env'
import fp from 'fastify-plugin'
import { fileURLToPath } from 'node:url'

export type ApiEnv = {
  PORT: number
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  SPA_ORIGIN: string
}

declare module 'fastify' {
  interface FastifyInstance {
    config: ApiEnv
  }
}

const envSchema = {
  type: 'object',
  required: ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'SPA_ORIGIN'],
  properties: {
    PORT: { type: 'integer', default: 3001 },
    DATABASE_URL: { type: 'string', minLength: 1 },
    BETTER_AUTH_SECRET: { type: 'string', minLength: 32 },
    BETTER_AUTH_URL: { type: 'string', minLength: 1 },
    SPA_ORIGIN: { type: 'string', minLength: 1 },
  },
} as const

const envOptions = {
  confKey: 'config',
  dotenv: {
    path: fileURLToPath(new URL('../../../../../.env', import.meta.url)),
  },
  schema: envSchema,
} as const

export default fp(async function envPlugin(fastify) {
  await fastify.register(fastifyEnv, envOptions)
}, { name: 'env' })
