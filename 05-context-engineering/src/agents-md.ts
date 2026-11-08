// TODO(05): load project instructions into the system prompt at session start.
import fs from "node:fs";
import path from "node:path";

export function loadAgentsMd(workspaceDir: string): string | null {
  // TODO: read AGENTS.md (fallback CLAUDE.md) if present; cap its size; return null if missing
  void fs; void path; void workspaceDir;
  return null;
}

export function buildSystemPrompt(base: string, agentsMd: string | null): string {
  // Stable content only: this string must be identical on every turn for caching to work.
  return agentsMd ? `${base}\n\n<project_instructions>\n${agentsMd}\n</project_instructions>` : base;
}
