// TODO(06): a minimal hook system for your loop.
export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultLike {
  content: string;
  isError: boolean;
}

export interface Hooks {
  /** Return { block } to refuse the call; the reason goes back to the model as an error result. */
  preToolUse?(call: ToolCall): Promise<{ block?: string }>;
  /** Return { append } to add text (e.g. compiler errors) to the tool result. Silent on success. */
  postToolUse?(call: ToolCall, result: ToolResultLike): Promise<{ append?: string }>;
  /** Called when the model ends its turn. Return { continueWith } to push a user message and keep going. */
  onStop?(): Promise<{ continueWith?: string }>;
}

export const MAX_STOP_RETRIES = 3;

// TODO: implement createVerificationHooks(sandbox, workspaceDir): Hooks
//  - postToolUse: node --check on edited .js files
//  - onStop: hash-check *.test.js, then run `node --test`; on failure return the output tail
