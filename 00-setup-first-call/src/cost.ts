// TODO(00): turn a response's usage into dollars. Reused by every later module.
import type Anthropic from '@anthropic-ai/sdk';
import { PRICING } from '../../shared/config.js';

export function costUsd(model: string, usage: Anthropic.Usage): number {
  const p = PRICING[model];
  if (!p) throw new Error(`No pricing for model ${model}`);

  const total =
    usage.input_tokens * p.input +
    usage.output_tokens * p.output +
    (usage.cache_creation_input_tokens || 0) * p.cacheWrite +
    (usage.cache_read_input_tokens || 0) * p.cacheRead;
  return total / 1_000_000;
}
