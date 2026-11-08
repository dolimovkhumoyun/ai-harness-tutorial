// TODO(02): append-only JSONL tracer.
import fs from "node:fs";
import path from "node:path";

export type TraceEvent =
  | { type: "run_start"; task: string; model: string }
  | { type: "turn"; turn: number; latency_ms: number; stop_reason: string | null; usage: unknown }
  | { type: "tool_call"; turn: number; name: string; input: unknown; output_preview: string; output_bytes: number; is_error: boolean; duration_ms: number }
  | { type: "run_end"; status: string; turns: number; cost_usd: number };

export class Tracer {
  readonly runId: string;
  readonly file: string;

  constructor(dir = "traces") {
    this.runId = "TODO"; // e.g. `${Date.now()}-${randomUUID().slice(0, 8)}`
    this.file = path.join(dir, `${this.runId}.jsonl`);
    // TODO: mkdir -p dir
  }

  log(event: TraceEvent): void {
    // TODO: add { run_id, ts }, redact, then append one JSON line
    void fs; void event;
    throw new Error("TODO: implement Tracer.log");
  }
}

/** Masks things that look like secrets. Applied to every event before writing. */
export function redact(value: unknown): unknown {
  // TODO: walk strings/objects/arrays; replace sk-ant-..., Bearer ..., password=... with ***
  return value;
}
