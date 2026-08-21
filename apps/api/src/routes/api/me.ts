import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyPluginAsync } from 'fastify'

const meRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', async (request, reply) => {
    const session = await fastify.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    })

    if (!session) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    return reply.send(session)
  })
}

export default meRoutes
