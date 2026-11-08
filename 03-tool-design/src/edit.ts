// TODO(03): exact-string-replace edit tool.
import type Anthropic from "@anthropic-ai/sdk";
import type { ToolOutput } from "./tools.js";

export const EDIT_TOOL: Anthropic.Tool = {
  name: "edit_file",
  strict: true,
  description: "TODO: what it does, WHEN to use it, and the 'old_string must be unique' rule",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      path: { type: "string", description: "TODO" },
      old_string: { type: "string", description: "TODO" },
      new_string: { type: "string", description: "TODO" },
    },
    required: ["path", "old_string", "new_string"],
  },
};

export async function editFile(input: { path: string; old_string: string; new_string: string }): Promise<ToolOutput> {
  // TODO:
  // - "" old_string + missing file → create
  // - 0 matches → helpful error (closest match / file head)
  // - >1 matches → error with line numbers
  // - 1 match → write, return snippet around the change
  void input;
  return { content: "TODO: implement edit_file", isError: true };
}
