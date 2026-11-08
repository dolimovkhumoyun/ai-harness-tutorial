// The agent loop.
import type Anthropic from '@anthropic-ai/sdk';
import { createClient } from '../../shared/client.js';
import { MODEL, MAX_TURNS } from '../../shared/config.js';
import { TOOLS, WORKDIR, executeTool, closePrompt, type ToolOutput } from './tools.js';
import { costUsd } from '../../00-setup-first-call/src/cost.js';

const client = createClient();

const SYSTEM = `You are a coding assistant working in a local repository.
Your working directory is ${WORKDIR}. Relative paths in read_file and bash resolve from there.
Use read_file to read files. Use bash to explore (ls, find, grep, wc). The user must approve every bash command, so prefer read_file for reading and keep commands short and safe.
If a tool result starts with ERROR, read it and try a different approach.
When you have the answer, reply with it directly.`;

const STOP_MESSAGES: Record<string, string> = {
  end_turn: 'the model finished',
  max_tokens: 'hit max_tokens, so the answer may be cut off',
  refusal: 'the model refused',
  max_turns: `hit MAX_TURNS (${MAX_TURNS})`,
};

export interface RunResult {
  finalText: string;
  turns: number;
  stopReason: string;
  usage: { input: number; output: number; costUsd: number };
}

function describeInput(input: unknown): string {
  const i = input as Record<string, unknown>;
  if (typeof i?.command === 'string') return i.command;
  if (typeof i?.path === 'string') return i.path;
  return JSON.stringify(input);
}

function formatSize(text: string): string {
  const bytes = Buffer.byteLength(text);
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function describeResult(result: ToolOutput): string {
  const status = result.exitCode !== undefined ? `exit ${result.exitCode}` : result.isError ? 'error' : 'ok';
  return `${status}, ${formatSize(result.content)}`;
}

export async function runAgent(task: string): Promise<RunResult> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: task }];

  let turns = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let totalCost = 0;
  let finalText = '';
  let stopReason = 'max_turns'; // only stays this if the loop runs out of turns

  try {
    while (turns < MAX_TURNS) {
      turns++;
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        system: SYSTEM,
        tools: TOOLS,
        messages,
      });
      inputTokens += response.usage.input_tokens;
      outputTokens += response.usage.output_tokens;
      totalCost += costUsd(MODEL, response.usage); // includes cache reads

      // The FULL content goes back unchanged (thinking blocks included).
      messages.push({ role: 'assistant', content: response.content });

      finalText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');

      if (response.stop_reason !== 'tool_use') {
        stopReason = response.stop_reason ?? 'unknown';
        break;
      }

      // Every tool_use gets a tool_result with the same id, all in ONE user message.
      const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
      const toolResults = await Promise.all(
        toolUses.map(async (toolUse): Promise<Anthropic.ToolResultBlockParam> => {
          console.log(`→ ${toolUse.name}: ${describeInput(toolUse.input)}`);
          const result = await executeTool(toolUse.name, toolUse.input);
          console.log(`← ${toolUse.name} (${describeResult(result)})`);
          return {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result.content,
            is_error: result.isError,
          };
        }),
      );

      messages.push({ role: 'user', content: toolResults });
    }
  } finally {
    closePrompt(); // let the process exit
  }

  console.log(`\n■ Stopped: ${STOP_MESSAGES[stopReason] ?? `stop_reason=${stopReason}`}`);

  return {
    finalText,
    turns,
    stopReason,
    usage: { input: inputTokens, output: outputTokens, costUsd: totalCost },
  };
}
