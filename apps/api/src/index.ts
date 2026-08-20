import Fastify from 'fastify';

const port = Number(process.env.PORT ?? 3001);
const server = Fastify({ logger: true });

server.get('/health', async () => ({ status: 'ok' }));
server.get('/', async () => ({ message: 'Hello from Fastify API' }));

const start = async () => {
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`API listening at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
