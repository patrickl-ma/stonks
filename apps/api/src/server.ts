import Fastify, { type FastifyInstance } from 'fastify'
import app from './app.js'

export const buildServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({ logger: true })

  await server.register(app)

  return server
}
