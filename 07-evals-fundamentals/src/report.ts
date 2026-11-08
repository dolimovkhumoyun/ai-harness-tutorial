// TODO(07): turn results JSONL into a table.
// Usage: npx tsx 07-evals-fundamentals/src/report.ts 07-evals-fundamentals/results/<runId>.jsonl
import fs from "node:fs";
import type { AttemptResult } from "./runner.js";
import { passAtK, passHatK } from "./metrics.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: report.ts <results.jsonl>");
  process.exit(1);
}

const rows: AttemptResult[] = fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));

// TODO: group by task → n, c, pass@1, pass@3, pass^3, mean cost, mean turns
// then print totals (macro-average across tasks). console.table() is fine.
void passAtK; void passHatK;
console.log(`${rows.length} attempts loaded. TODO: build the report.`);
