// TODO(03): capped code search (ripgrep, fallback grep).
import type Anthropic from "@anthropic-ai/sdk";
import type { ToolOutput } from "./tools.js";

export const MAX_MATCHES = 30;

export const SEARCH_TOOL: Anthropic.Tool = {
  name: "search",
  strict: true,
  description: "TODO: when to search vs. read; what the output looks like; that it is capped",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      pattern: { type: "string", description: "TODO: regex? literal?" },
      path: { type: "string", description: "TODO" },
      glob: { type: "string", description: "TODO e.g. '*.ts'" },
    },
    required: ["pattern", "path", "glob"],
  },
};

export async function search(input: { pattern: string; path: string; glob: string }): Promise<ToolOutput> {
  // TODO: run `rg -n --glob <glob> <pattern> <path>` (execFile, NOT exec: avoid shell injection)
  // cap at MAX_MATCHES and append "…N more matches, narrow your pattern"
  void input;
  return { content: "TODO: implement search", isError: true };
}
