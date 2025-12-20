/**
 * MetricsService - Tracks token usage and cost metrics
 * Accumulates metrics across a session
 */

export interface Metrics {
  totalCost: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  requestCount: number;
}

export class MetricsService {
  private totalCost: number = 0;
  private totalTokensInput: number = 0;
  private totalTokensOutput: number = 0;
  private requestCount: number = 0;

  /**
   * Record token usage and cost from a single request
   */
  recordUsage(tokens: { input: number; output: number }, cost: number): void {
    this.totalTokensInput += tokens.input;
    this.totalTokensOutput += tokens.output;
    this.totalCost += cost;
    this.requestCount++;
  }

  /**
   * Get current metrics
   */
  getMetrics(): Metrics {
    return {
      totalCost: this.totalCost,
      totalTokensInput: this.totalTokensInput,
      totalTokensOutput: this.totalTokensOutput,
      requestCount: this.requestCount
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.totalCost = 0;
    this.totalTokensInput = 0;
    this.totalTokensOutput = 0;
    this.requestCount = 0;
  }

  /**
   * Get total tokens (input + output)
   */
  getTotalTokens(): number {
    return this.totalTokensInput + this.totalTokensOutput;
  }

  /**
   * Get average tokens per request
   */
  getAverageTokensPerRequest(): number {
    if (this.requestCount === 0) return 0;
    return this.getTotalTokens() / this.requestCount;
  }

  /**
   * Get average cost per request
   */
  getAverageCostPerRequest(): number {
    if (this.requestCount === 0) return 0;
    return this.totalCost / this.requestCount;
  }
}
