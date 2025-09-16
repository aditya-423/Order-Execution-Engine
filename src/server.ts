// src/server.ts
import Fastify, { type FastifyRequest } from 'fastify';
import websocketPlugin from '@fastify/websocket';
import { randomUUID } from 'crypto';
import { orderQueue } from './queue.js';
import { Redis } from 'ioredis';

// Create the Fastify app instance
const fastify = Fastify({ logger: true });

// Register the websocket plugin at the top level
fastify.register(websocketPlugin);

// Define the shape of our URL parameters
interface OrderParams {
  orderId: string;
}

// Encapsulate all our application routes inside a plugin
fastify.register(async function (fastify) {

  // This route creates the order and returns the ID
  fastify.post('/api/orders/execute', async (request, reply) => {
    const orderId = randomUUID();
    const orderDetails = { orderId, tokenIn: 'SOL', tokenOut: 'USDC', amount: 10 };
    await orderQueue.add(orderId, orderDetails);
    fastify.log.info(`Added order ${orderId} to the queue.`);
    return { orderId };
  });

  // This route handles the WebSocket connection for a specific order
  fastify.route<{ Params: OrderParams }>({
    method: 'GET',
    url: '/api/orders/status/:orderId',
    
    handler: (request, reply) => {
    // This handler is required by Fastify's types but is not used for WebSocket connections.
    // The connection is automatically upgraded to a WebSocket by the plugin.
  },

    wsHandler: (connection, request) => {
      // The `request` object from the initial handshake now correctly contains params
      const { orderId } = request.params;

      if (!orderId) {
        fastify.log.error('Could not get orderId from request.params.');
        // All interactions must use connection.socket
        connection.close();
        return;
      }
      
      fastify.log.info(`WebSocket connection established for order: ${orderId}`);

      const subscriber = new Redis({ maxRetriesPerRequest: null });
      const channel = `order-updates:${orderId}`;

      subscriber.subscribe(channel, (err) => {
        if (err) {
          fastify.log.error(`Failed to subscribe to ${channel}`, err as any);
          connection.send(JSON.stringify({ status: 'failed', error: 'Could not subscribe to updates' }));
          connection.close();
          return;
        }
        fastify.log.info(`Successfully subscribed to Redis channel: ${channel}`);
      });

      subscriber.on('message', (channel, message) => {
        if (channel === `order-updates:${orderId}`) {
          connection.send(message);
          try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.status === 'confirmed' || parsedMessage.status === 'failed') {
              connection.close();
            }
          } catch (e) {
            fastify.log.error('Error parsing message from Redis:', e as any);
          }
        }
      });

      connection.on('close', () => {
        fastify.log.info(`Client disconnected for order ${orderId}. Unsubscribing.`);
        subscriber.unsubscribe(channel);
        subscriber.quit();
      });

      connection.on('error', (err) => {
        fastify.log.error('WebSocket error on connection:', err as any);
      });
    }
  });
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' }); 
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();