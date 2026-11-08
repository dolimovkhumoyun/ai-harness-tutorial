// TODO(02): summarize one trace file.
// Usage: npx tsx 02-tracing/src/summarize.ts traces/<run_id>.jsonl
import fs from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: summarize.ts <trace.jsonl>");
  process.exit(1);
}

const events = fs
  .readFileSync(file, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

// TODO: print run id/model/status, turns, tool calls (+errors), tokens, cost,
// slowest tool, and the "input tokens per turn" growth line.
console.log(`${events.length} events. TODO: summarize them.`);
