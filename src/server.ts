// src/server.ts
import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import { orderQueue } from './queue.js'; // <-- Import the queue

const server = Fastify({ logger: true });

server.post('/api/orders/execute', async (request, reply) => {
  const orderId = randomUUID();
  // In the future, this data will come from the user's request
  const orderDetails = { tokenIn: 'SOL', tokenOut: 'USDC', amount: 10 };

  // Add a job to the queue. The first argument is a name for the job (we'll use the orderId),
  // and the second is the data the job needs.
  await orderQueue.add(orderId, orderDetails);

  server.log.info(`Added order ${orderId} to the queue.`);

  // We still return the orderId to the user.
  return { orderId };
});

const start = async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();