// Tool definitions + executor for the 01 agent.
import type Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';
import child_process from 'node:child_process';
import readline from 'node:readline';

/** Every tool works relative to this folder (the repo root). Module 04 swaps it for a sandbox. */
export const WORKDIR = path.resolve(import.meta.dirname, '../..');
const BASH_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_CHARS = 10_000;

/** What the model sees. Good descriptions matter (module 03 goes deeper). */
export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'read_file',
    description: `Reads a text file and returns its contents. Relative paths resolve from ${WORKDIR}. Output longer than ${MAX_OUTPUT_CHARS} characters is cut.`,
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'File path, relative to the working directory or absolute' } },
      required: ['path'],
    },
  },
  {
    name: 'bash',
    description: `Runs a shell command in ${WORKDIR} and returns the exit code, stdout and stderr. The user must approve each command. Times out after ${BASH_TIMEOUT_MS / 1000}s.`,
    input_schema: {
      type: 'object',
      properties: { command: { type: 'string', description: 'The shell command to run' } },
      required: ['command'],
    },
  },
];

export interface ToolOutput {
  content: string;
  isError: boolean;
  /** bash only: exit code, or 'timeout' / 'error' when the command didn't exit normally. */
  exitCode?: number | string;
}

/** DeepSeek ignores is_error, so the text itself must say it failed. */
function fail(message: string, exitCode?: number | string): ToolOutput {
  return { content: `ERROR: ${message}`, isError: true, exitCode };
}

function truncate(text: string): string {
  if (text.length <= MAX_OUTPUT_CHARS) return text;
  return `${text.slice(0, MAX_OUTPUT_CHARS)}\n… [output cut: showed ${MAX_OUTPUT_CHARS} of ${text.length} characters]`;
}

// ── y/N approval ────────────────────────────────────────────────────────────
// One shared prompt, and questions are queued so parallel bash calls are asked
// one at a time. Otherwise two prompts read the same stdin and one "y" can approve both.
let rl: readline.Interface | undefined;
let approvalQueue: Promise<unknown> = Promise.resolve();
let stdinEnded = false; // after Ctrl+D / end of piped input, nobody can answer: decline

function getPrompt(): readline.Interface {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('close', () => {
      rl = undefined;
      if (process.stdin.readableEnded) stdinEnded = true;
    });
  }
  return rl;
}

/** Close the prompt so the process can exit. Call once the run is over. */
export function closePrompt(): void {
  rl?.close();
}

function confirm(question: string): Promise<boolean> {
  const ask = async (): Promise<boolean> => {
    if (stdinEnded) return false;
    try {
      const prompt = getPrompt();
      const answer = await new Promise<string>((resolve) => {
        const onClose = () => resolve(''); // stdin closed: treat as "no"
        prompt.once('close', onClose);
        prompt.question(`${question} [y/N] `, (a) => {
          prompt.off('close', onClose);
          resolve(a);
        });
      });
      return /^y(es)?$/i.test(answer.trim());
    } catch {
      return false; // never approve by accident
    }
  };
  const result = approvalQueue.then(ask);
  approvalQueue = result.catch(() => {});
  return result;
}

// ── tools ───────────────────────────────────────────────────────────────────
async function readFile(input: unknown): Promise<ToolOutput> {
  const p = (input as { path?: unknown })?.path;
  if (typeof p !== 'string' || !p) return fail('read_file needs a "path" string.');
  try {
    const content = await fs.promises.readFile(path.resolve(WORKDIR, p), 'utf-8');
    return { content: truncate(content || '(empty file)'), isError: false };
  } catch (err) {
    return fail((err as Error).message);
  }
}

function formatBashResult(header: string, stdout: string, stderr: string): string {
  const parts = [header];
  if (stdout.trim()) parts.push('--- stdout ---', stdout.trimEnd());
  if (stderr.trim()) parts.push('--- stderr ---', stderr.trimEnd());
  if (parts.length === 1) parts.push('(no output)');
  return truncate(parts.join('\n'));
}

async function runBash(input: unknown): Promise<ToolOutput> {
  const command = (input as { command?: unknown })?.command;
  if (typeof command !== 'string' || !command.trim()) return fail('bash needs a "command" string.');

  if (!(await confirm(`Run: ${command}`))) {
    return fail('The user declined to run this command. Do not retry it; try another approach.', 'declined');
  }

  return new Promise((resolve) => {
    child_process.exec(
      command,
      { cwd: WORKDIR, timeout: BASH_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        // Normal exit (0 or non-zero): report the code and let the model judge it.
        // grep with no match exits 1, which isn't a real failure.
        if (!error || typeof error.code === 'number') {
          const exitCode = error ? (error.code as number) : 0;
          resolve({ content: formatBashResult(`exit code: ${exitCode}`, stdout, stderr), isError: false, exitCode });
          return;
        }
        // Didn't exit normally: timeout, killed, output too large, or couldn't start.
        const reason = error.killed
          ? `command timed out after ${BASH_TIMEOUT_MS / 1000}s`
          : error.signal
            ? `command was killed by ${error.signal}`
            : error.message;
        resolve({
          content: formatBashResult(`ERROR: ${reason}`, stdout, stderr), // keep partial output
          isError: true,
          exitCode: error.killed ? 'timeout' : 'error',
        });
      },
    );
  });
}

/** Runs one tool call. Never throws: failures come back as { isError: true }. */
export async function executeTool(name: string, input: unknown): Promise<ToolOutput> {
  try {
    switch (name) {
      case 'read_file':
        return await readFile(input);
      case 'bash':
        return await runBash(input);
      default:
        return fail(`Unknown tool: ${name}. Available tools: ${TOOLS.map((t) => t.name).join(', ')}.`);
    }
  } catch (err) {
    return fail(`${name} crashed: ${(err as Error).message}`);
  }
}
