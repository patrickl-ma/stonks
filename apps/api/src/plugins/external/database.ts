import { createDatabase, type Database } from '@stonks/db'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    db: Database['db']
  }
}

export default fp(async function databasePlugin(fastify) {
  const database = createDatabase(fastify.config.DATABASE_URL)

  fastify.decorate('db', database.db)
  fastify.addHook('onClose', () => database.close())
}, {
  name: 'database',
  dependencies: ['env'],
})
