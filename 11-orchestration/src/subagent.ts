// TODO(11): a `delegate` tool that runs a child agent with a fresh context.
import type Anthropic from "@anthropic-ai/sdk";

export const DELEGATE_TOOL: Anthropic.Tool = {
  name: "delegate",
  strict: true,
  description:
    "TODO: when to delegate (broad exploration, many files), what to pass (a self-contained task), " +
    "and that the subagent is read-only and returns only a short result.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      task: { type: "string", description: "Self-contained task; the subagent sees none of your history" },
      returnFormat: { type: "string", description: "Exact shape of the answer you want back" },
    },
    required: ["task", "returnFormat"],
  },
};

export interface SubagentOptions {
  model: string;
  maxTurns: number;
  parentRunId: string;
  readOnlyTools: Anthropic.Tool[];
}

export async function runSubagent(input: { task: string; returnFormat: string }, opts: SubagentOptions): Promise<string> {
  // TODO: build a system prompt for the child, call your loop with ONLY opts.readOnlyTools,
  // a fresh messages[] and opts.maxTurns; trace with parent_run_id; return the final text (capped).
  void input; void opts;
  throw new Error("TODO: implement runSubagent");
}
