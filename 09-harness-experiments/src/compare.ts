// TODO(09): compare two eval result files.
// Usage: npx tsx 09-harness-experiments/src/compare.ts results/baseline.jsonl results/variant.jsonl
import fs from "node:fs";

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error("Usage: compare.ts <baseline.jsonl> <variant.jsonl>");
  process.exit(1);
}

const load = (f: string) => fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const base = load(a);
const variant = load(b);

// TODO:
// 1. check both files cover the same task ids and k (refuse to compare otherwise)
// 2. per task: pass rate A vs B, delta
// 3. overall: pass rate (+ bootstrap 95% interval), pass^3, mean cost, mean turns, tool error rate
// 4. verdict: interval of the difference excludes 0 → "improved"/"worse", else "no clear difference"
console.log(`baseline: ${base.length} attempts, variant: ${variant.length} attempts. TODO: compare.`);
