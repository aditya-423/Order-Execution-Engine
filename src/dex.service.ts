// A helper function to simulate network delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// A fake base price for our tokens to simulate market rates
const basePrice = 100;

export class MockDexRouter {
  // Simulates getting a price quote from the Raydium exchange
  async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number) {
    await sleep(200); // Simulate network delay
    const price = basePrice * (0.98 + Math.random() * 0.04);
    console.log(`[DEX] Raydium Quote: ${price.toFixed(2)}`);
    return { price: price, fee: 0.003, dex: 'Raydium' };
  }

  // Simulates getting a price quote from the Meteora exchange
  async getMeteoraQuote(tokenIn: string, tokenOut: string, amount: number) {
    await sleep(250); // Simulate slightly different delay
    const price = basePrice * (0.97 + Math.random() * 0.05);
    console.log(`[DEX] Meteora Quote: ${price.toFixed(2)}`);
    return { price: price, fee: 0.002, dex: 'Meteora' };
  }

  // This function compares the quotes and returns the best one
  async getBestQuote(tokenIn: string, tokenOut: string, amount: number) {
    console.log('[DEX] Routing: Fetching quotes...');
    const raydiumQuote = await this.getRaydiumQuote(tokenIn, tokenOut, amount);
    const meteoraQuote = await this.getMeteoraQuote(tokenIn, tokenOut, amount);

    // For a buy order, you want the lowest price.
    if (raydiumQuote.price <= meteoraQuote.price) {
      console.log('[DEX] Decision: Best price found on Raydium.');
      return raydiumQuote;
    } else {
      console.log('[DEX] Decision: Best price found on Meteora.');
      return meteoraQuote;
    }
  }
}