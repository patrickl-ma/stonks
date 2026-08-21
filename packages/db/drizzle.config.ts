import { envSchema } from 'env-schema'
import { defineConfig } from 'drizzle-kit'
import { fileURLToPath } from 'node:url'

type DatabaseEnv = {
  DATABASE_URL: string
}

const { DATABASE_URL } = envSchema<DatabaseEnv>({
  dotenv: {
    path: fileURLToPath(new URL('../../.env', import.meta.url)),
  },
  schema: {
    type: 'object',
    required: ['DATABASE_URL'],
    properties: {
      DATABASE_URL: { type: 'string', minLength: 1 },
    },
  },
})

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
})
