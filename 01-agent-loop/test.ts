import { MODEL, MAX_TURNS } from '../shared/config.js';
import { createClient } from '../shared/client.js';
import { BashSession } from '../shared/bashSession.js';
import type { MessageParam, Tool, ToolResultBlockParam } from '@anthropic-ai/sdk/resources';

const tools: Tool[] = [
  {
    name: 'bash',
    description: 'Run a bash command and return its output.',
    input_schema: {
      type: 'object',
      properties: { command: { type: 'string', description: 'The bash command to run' } },
      required: ['command'],
    },
  },
];

const askAI = async (prompt: string) => {
  const client = createClient();
  const bashSession = new BashSession();

  const messages: MessageParam[] = [{ role: 'user', content: prompt }];

  try {
    for (let turn = 1; turn <= MAX_TURNS; turn++) {
      const response = await client.messages.create({ model: MODEL, max_tokens: 8000, tools, messages });
      console.log(`[turn ${turn}]`, JSON.stringify(response.content, null, 2));
      // The whole assistant turn goes back, including text and thinking blocks
      messages.push({ role: 'assistant', content: response.content });

      // No more tool calls: the model is done
      if (response.stop_reason !== 'tool_use') {
        console.log(`[turn ${turn}] stop_reason: ${response.stop_reason}`);
        return;
      }

      // One tool_result for each tool_use block, all returned in the next user message
      const results: ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        if (block.name !== 'bash') {
          results.push({ type: 'tool_result', tool_use_id: block.id, content: `Unknown tool: ${block.name}`, is_error: true });
          continue;
        }
        const input = block.input as { command: string };
        const output = await bashSession.executeCommand(input.command);
        results.push({ type: 'tool_result', tool_use_id: block.id, content: output || '(no output)' });
      }
      messages.push({ role: 'user', content: results });
    }

    console.log(`Stopped: reached MAX_TURNS (${MAX_TURNS})`);
  } finally {
    bashSession.process.stdin.end(); // closing stdin ends the shell so the script can exit
  }
};

askAI('How many TypeScript files are in this repo, and what does shared/config.ts export?');
