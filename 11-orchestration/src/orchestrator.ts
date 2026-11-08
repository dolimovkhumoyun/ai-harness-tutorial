// TODO(11): planner → parallel workers → evaluator.
import * as z from "zod";

export const Plan = z.object({
  subtasks: z.array(z.object({ id: z.string(), description: z.string(), files: z.array(z.string()) })),
});
export type Plan = z.infer<typeof Plan>;

export async function plan(task: string): Promise<Plan> {
  // TODO: one model call with structured output → Plan
  void task;
  throw new Error("TODO: plan");
}

export async function runWorkers(p: Plan, concurrency = 3): Promise<Array<{ id: string; result: string }>> {
  // TODO: run one agent per subtask, at most `concurrency` at a time
  void p; void concurrency;
  throw new Error("TODO: runWorkers");
}

export async function evaluate(task: string, results: Array<{ id: string; result: string }>): Promise<{ accept: boolean; feedback: string }> {
  // TODO: deterministic checks first (build/tests), then an LLM judge against the original task
  void task; void results;
  throw new Error("TODO: evaluate");
}
