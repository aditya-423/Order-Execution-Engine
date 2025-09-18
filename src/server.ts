import Fastify, { type FastifyRequest } from 'fastify';
import websocketPlugin from '@fastify/websocket';
import { randomUUID } from 'crypto';
import { orderQueue } from './queue.js';
import { Redis } from 'ioredis';

const fastify = Fastify({ logger: true });

// Register the websocket plugin
fastify.register(websocketPlugin);

// Define the shape of our URL parameters
interface OrderParams {
  tokenIn: string;
  tokenOut: string;
  amount: string; // URL params are always strings initially
}

// Encapsulate all our application routes inside a plugin
fastify.register(async function (fastify) {

  // This single WebSocket route handles creating and monitoring an order
  fastify.route<{ Params: OrderParams }>({
    method: 'GET',
    url: '/api/orders/execute/:tokenIn/:tokenOut/:amount',
    
    // This handler is required by Fastify's types for the route definition
    handler: (request, reply) => {
      // The connection is automatically upgraded to a WebSocket.
    },

    // This handler manages the live WebSocket connection.
    wsHandler: (connection, request) => {
      const { tokenIn, tokenOut, amount } = request.params;
      const orderId = randomUUID();
      
      // Use the parameters from the URL to create the order
      const orderDetails = { orderId, tokenIn, tokenOut, amount: parseFloat(amount) };
      orderQueue.add(orderId, orderDetails);
      fastify.log.info(`Order ${orderId} for ${amount} ${tokenIn}->${tokenOut} created and queued.`);
      
      const subscriber = new Redis({ maxRetriesPerRequest: null });
      const channel = `order-updates:${orderId}`;

      subscriber.subscribe(channel, (err) => {
        if (err) {
          fastify.log.error(`Failed to subscribe to ${channel}`, err as any);
          connection.send(JSON.stringify({ status: 'failed', error: 'Could not subscribe to updates' }));
          connection.close();
          return;
        }
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
        fastify.log.info(`Client disconnected for order ${orderId}.`);
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