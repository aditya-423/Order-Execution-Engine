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

// Encapsulate all our application routes inside a plugin
fastify.register(async function (fastify) {

  // This single route now handles both creating and monitoring an order via WebSocket
  fastify.route({
    method: 'GET',
    url: '/api/orders/execute',
    
    // This handler is required by Fastify's types for the route definition
    handler: (request, reply) => {
      // The connection is automatically upgraded to a WebSocket.
    },

    // This handler manages the live WebSocket connection.
    wsHandler: (connection, request) => {
      // 1. Create a new order immediately upon WebSocket connection
      const orderId = randomUUID();
      const orderDetails = { orderId, tokenIn: 'SOL', tokenOut: 'USDC', amount: 10 };
      orderQueue.add(orderId, orderDetails);
      fastify.log.info(`Order ${orderId} created via WebSocket and queued.`);
      
      // 2. Subscribe to Redis to get updates for the order we just created
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

      // 3. Forward messages from Redis to the connected client
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

      // 4. Clean up when the client disconnects
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