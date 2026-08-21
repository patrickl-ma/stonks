import { buildServer } from './server.js'

const start = async () => {
  let server: Awaited<ReturnType<typeof buildServer>> | undefined

  try {
    server = await buildServer()
    const { PORT: port } = server.config

    await server.listen({ port, host: '0.0.0.0' })
    console.log(`API listening at http://localhost:${port}`)
  } catch (err) {
    if (server) {
      server.log.error(err)
    } else {
      console.error(err)
    }
    process.exit(1)
  }
}

void start()
