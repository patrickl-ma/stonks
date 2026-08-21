import fp from 'fastify-plugin'
import corsPlugin from './plugins/external/cors.js'
import databasePlugin from './plugins/external/database.js'
import envPlugin from './plugins/external/env.js'
import authPlugin from './plugins/app/auth.js'
import authRoutes from './routes/api/auth.js'
import meRoutes from './routes/api/me.js'

export default fp(async function app(fastify) {
  await fastify.register(envPlugin)
  await fastify.register(databasePlugin)
  await fastify.register(authPlugin)
  await fastify.register(corsPlugin)

  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(meRoutes, { prefix: '/api' })

  fastify.get('/health', async () => ({ status: 'ok' }))
  fastify.get('/', async () => ({ message: 'Hello from Fastify API' }))
}, { name: 'app' })
