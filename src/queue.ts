import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

// Creating a new connection to the Redis server
const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

// Create and export the queue so other files can use it
export const orderQueue = new Queue('order-processing', { connection });