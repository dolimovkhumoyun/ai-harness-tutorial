// TODO(05): summarize-and-restart compaction (append-only safe).
import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "../../shared/config.js";

export const COMPACT_AT = 60_000; // input tokens; low on purpose so you can see it trigger

const HANDOFF_PROMPT = `TODO: ask for goal (verbatim), done, decisions, failures, next step`;

/**
 * Returns a NEW history: one user message carrying the handoff summary.
 * Never edits the old array in place.
 */
export async function compact(client: Anthropic, system: string, messages: Anthropic.MessageParam[]): Promise<Anthropic.MessageParam[]> {
  // TODO:
  // 1. call the model with [...messages, { role: "user", content: HANDOFF_PROMPT }] (no tools needed)
  //    note: if the last message holds tool_results, the summary request still works; it's a user turn
  // 2. take the text of the reply
  // 3. return [{ role: "user", content: `Summary of the work so far:\n${summary}\n\nContinue the task.` }]
  void client; void system; void messages; void MODEL; void HANDOFF_PROMPT;
  throw new Error("TODO: implement compact");
}
