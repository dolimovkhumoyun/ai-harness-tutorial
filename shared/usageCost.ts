import { PRICING } from './config.js';

/**
 * The usage fields that cost money. `Anthropic.Usage` (response.usage) fits this shape.
 * DeepSeek, like Anthropic: input_tokens EXCLUDES cache hits, which are counted in
 * cache_read_input_tokens. Total input = input + cache_read + cache_creation.
 * https://api-docs.deepseek.com/guides/anthropic_api
 */
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null; // always 0 on DeepSeek today
}

/** USD for one response's usage (or a sum of several). Off-peak prices, so a lower bound. */
export function getUsageCost(model: string, usage: TokenUsage): number {
  const p = PRICING[model];
  if (!p) throw new Error(`No pricing for model ${model}`);

  const total =
    usage.input_tokens * p.input +
    usage.output_tokens * p.output +
    (usage.cache_read_input_tokens ?? 0) * p.cacheRead +
    (usage.cache_creation_input_tokens ?? 0) * p.cacheWrite;
  return total / 1_000_000;
}
