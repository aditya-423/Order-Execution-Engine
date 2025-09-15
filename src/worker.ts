import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { MockDexRouter } from './dex.service.js';

const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

const worker = new Worker('order-processing', async (job) => {
  const { tokenIn, tokenOut, amount } = job.data;
  console.log(`[Worker] Processing order ${job.name}...`);

  const dexRouter = new MockDexRouter();
  const bestQuote = await dexRouter.getBestQuote(tokenIn, tokenOut, amount);

  console.log(`[Worker] Routing decision for order ${job.name}: Chose ${bestQuote.dex} at price ${bestQuote.price.toFixed(2)}`);

  return { orderId: job.name, bestQuote };
}, { connection });

worker.on('completed', (job, result) => {
  console.log(`[Worker] Completed job ${job.id} with result:`, result);
});

worker.on('failed', (job, err) => {
  if (job) {
    console.error(`[Worker] Failed job ${job.id} with error:`, err.message);
  }
});

console.log('[Worker] Worker started and listening for jobs...');