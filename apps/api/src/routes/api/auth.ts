import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyPluginAsync } from 'fastify'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: ['GET', 'POST'],
    url: '/*',
    handler: async (request, reply) => {
      const url = new URL(request.url, fastify.config.BETTER_AUTH_URL)
      const body = request.body === undefined ? undefined : JSON.stringify(request.body)
      const authRequest = new Request(url, {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        body,
      })

      const response = await fastify.auth.handler(authRequest)
      response.headers.forEach((value, key) => reply.header(key, value))

      return reply
        .code(response.status)
        .send(Buffer.from(await response.arrayBuffer()))
    },
  })
}

export default authRoutes
