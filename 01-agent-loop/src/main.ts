// CLI entry. This file is done; implement agent.ts and tools.ts.
import { runAgent } from "./agent.js";

const task = process.argv.slice(2).join(" ");
if (!task) {
  console.error('Usage: npx tsx --env-file=.env 01-agent-loop/src/main.ts "your task"');
  process.exit(1);
}

const result = await runAgent(task);
console.log("\n" + result.finalText);
console.log(
  `\n— stop=${result.stopReason} · turns=${result.turns} · in=${result.usage.input} · out=${result.usage.output} · $${result.usage.costUsd.toFixed(4)}`,
);
