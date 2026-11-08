// One place that creates the API client for every module.
//
// Why not `new Anthropic()`? It reads ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL from the
// environment, and tools like Claude Code set those in your shell. Node's --env-file never
// overrides a variable that is already set, so your .env would be silently ignored and your
// key sent to the wrong server. Lab-specific names avoid that clash.
import Anthropic from "@anthropic-ai/sdk";

export const DEFAULT_BASE_URL = "https://api.deepseek.com/anthropic";

export function createClient(): Anthropic {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_API_KEY is not set. Put it in .env and run with: npx tsx --env-file=.env <file>");
  }
  return new Anthropic({ apiKey, baseURL: process.env.LLM_BASE_URL ?? DEFAULT_BASE_URL });
}
