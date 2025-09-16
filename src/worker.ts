import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { MockDexRouter } from './dex.service.js';
import { pool } from './db.js';

const connection = new Redis({ maxRetriesPerRequest: null });
const publisher = new Redis(); // A separate connection for publishing updates

const worker = new Worker('order-processing', async (job) => {
  const { orderId, tokenIn, tokenOut, amount } = job.data;
  console.log(`[Worker] Processing order ${orderId}...`);
  const channel = `order-updates:${orderId}`; // Define a unique channel for this order

  // Inside the worker process in src/worker.ts

  try {
    const dexRouter = new MockDexRouter();
    // Helper function to create a delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. PENDING status
    publisher.publish(channel, JSON.stringify({ status: 'pending' }));
    await delay(10000); // Wait 1 second

    // 2. ROUTING status
    publisher.publish(channel, JSON.stringify({ status: 'routing' }));
    const bestQuote = await dexRouter.getBestQuote(tokenIn, tokenOut, amount);
    console.log(`[Worker] Routing decision for ${orderId}: Chose ${bestQuote.dex}`);
    await delay(2000); // Wait 1 second

    // 3. BUILDING status (simulated)
    publisher.publish(channel, JSON.stringify({ status: 'building' }));
    await delay(2000); // Wait 1 second

    // 4. SUBMITTED status (simulated)
    publisher.publish(channel, JSON.stringify({ status: 'submitted' }));
    await delay(2500); // Wait 1.5 seconds

    // 5. CONFIRMED status
    const txHash = `mock_tx_${Math.random().toString(36).substring(2, 15)}`;
    publisher.publish(channel, JSON.stringify({ status: 'confirmed', txHash, finalPrice: bestQuote.price }));
    console.log(`[Worker] Order ${orderId} confirmed.`);

    // --- SAVE SUCCESSFUL RESULT TO POSTGRESQL ---
    await pool.query(
      'INSERT INTO orders (id, status, final_price, transaction_hash) VALUES ($1, $2, $3, $4)',
      [orderId, 'confirmed', bestQuote.price, txHash]
    );
    console.log(`[DB] Saved confirmed order ${orderId} to PostgreSQL.`);

    return { orderId, bestQuote };

  } catch (error) {
    // ... your catch block remains the same
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    publisher.publish(channel, JSON.stringify({ status: 'failed', error: errorMessage }));

    // --- SAVE FAILED RESULT TO POSTGRESQL ---
    await pool.query(
      'INSERT INTO orders (id, status, error_message) VALUES ($1, $2, $3)',
      [job.data.orderId, 'failed', errorMessage]
    );
    console.log(`[DB] Saved failed order ${job.data.orderId} to PostgreSQL.`);

    throw error;
  }
}, { connection });

worker.on('completed', (job) => console.log(`[Worker] Completed job ${job.id}`));
worker.on('failed', (job, err) => {
  const jobId = job?.id ?? 'unknown';
  console.error(`[Worker] Failed job ${jobId} with error:`, err.message);
});

console.log('[Worker] Worker started...');