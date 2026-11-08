// TODO(07): run every task k times with a clean workspace, grade, record JSONL.
// Usage: npx tsx --env-file=.env 07-evals-fundamentals/src/runner.ts --k 3 [--oracle]
import fs from "node:fs";
import path from "node:path";

export interface TaskSpec {
  id: string;
  prompt: string;
  tags: string[];
  timeout_sec: number;
  grader: { type: "command"; command: string };
}

export interface AttemptResult {
  task: string;
  attempt: number;
  passed: boolean;
  turns: number;
  cost_usd: number;
  duration_ms: number;
  trace_file?: string;
  grader_output_tail: string;
}

const TASKS_DIR = path.join("07-evals-fundamentals", "tasks");

export function loadTasks(): Array<{ dir: string; spec: TaskSpec }> {
  return fs
    .readdirSync(TASKS_DIR)
    .filter((d) => fs.existsSync(path.join(TASKS_DIR, d, "task.json")))
    .map((d) => ({
      dir: path.join(TASKS_DIR, d),
      spec: JSON.parse(fs.readFileSync(path.join(TASKS_DIR, d, "task.json"), "utf8")) as TaskSpec,
    }));
}

async function main() {
  const tasks = loadTasks();
  console.log(`Found ${tasks.length} task(s): ${tasks.map((t) => t.spec.id).join(", ")}`);
  // TODO for each task, for attempt 1..k:
  //  1. copy <task>/workspace to a fresh temp dir (fs.cpSync(src, dst, { recursive: true }))
  //  2. --oracle ? copy <task>/solution over it : run your module-06 agent on it with spec.prompt
  //  3. start a sandbox with the workspace at /workspace AND <task>/grader at /grader (read-only)
  //  4. run spec.grader.command → exit 0 = passed
  //  5. append AttemptResult to 07-evals-fundamentals/results/<runId>.jsonl
  throw new Error("TODO: implement the runner");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
