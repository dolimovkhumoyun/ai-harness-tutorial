// Usage: npx tsx --env-file=.env 00-setup-first-call/src/ask.ts "question" --effort low
import Anthropic from '@anthropic-ai/sdk';
import { MODEL } from '../../shared/config.js';
import { costUsd } from './cost.js';
import { createClient } from '../../shared/client.js';

const SYSTEM =
  'Answer the question concisely and act as a Senior Azure Architect who is explaining to person with zero coding skills.';
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
type Effort = (typeof EFFORTS)[number];

async function main() {
  const start = Date.now();
  let query;
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i]?.startsWith('--')) {
      ++i;
      continue;
    }
    query = process.argv[i];
    break;
  }

  if (!query) {
    console.error('No question provided.');
    process.exit(1);
  }

  const effortIndex = process.argv.indexOf('--effort');
  if (effortIndex !== -1 && !EFFORTS.includes(process.argv[effortIndex + 1] as Effort)) {
    console.error('Invalid effort value. Must be one of:', EFFORTS.join(', '));
    process.exit(1);
  }
  const effort: Effort = effortIndex === -1 ? 'medium' : (process.argv[effortIndex + 1] as Effort);

  const client = createClient();
  const response = await client.messages.create({
    model: MODEL,
    system: SYSTEM,
    max_tokens: 8000,
    output_config: { effort },
    messages: [{ role: 'user', content: query }],
  });

  for (const block of response.content) {
    if (block.type === 'text') console.log(block.text);
  }
  const latencyMs = Date.now() - start;
  const cost = costUsd(MODEL, response.usage);
  console.log(
    `\n— stop=${response.stop_reason}` +
      ` · in=${response.usage.input_tokens}` +
      ` · out=${response.usage.output_tokens}` +
      ` · $${cost.toFixed(6)}` +
      ` · ${latencyMs}ms`,
  );

  if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
    console.warn('Warning: stop_reason is', response.stop_reason);
  }
}

main().catch((err) => {
  if (err instanceof Anthropic.AuthenticationError) console.error('✗ Invalid API key. Check LLM_API_KEY in .env');
  else if (err instanceof Anthropic.RateLimitError) console.error('✗ Rate limited. Wait and retry');
  else if (err instanceof Anthropic.APIError) console.error(`✗ API error ${err.status}: ${err.message}`);
  else console.error('✗', err instanceof Error ? err.message : err);
  process.exit(1);
});
