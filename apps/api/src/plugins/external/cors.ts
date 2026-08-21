import cors from '@fastify/cors'
import fp from 'fastify-plugin'

export default fp(async function corsPlugin(fastify) {
  await fastify.register(cors, {
    origin: fastify.config.SPA_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
}, {
  name: 'cors',
  dependencies: ['env'],
})
