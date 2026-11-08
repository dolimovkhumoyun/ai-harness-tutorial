# 02 · Observability: traces

**Goal:** record everything your agent does, so you can debug failures and measure cost. You already know App Insights and KQL; this is the same idea, but for agents.
**Time:** 2–3 hours · **Prerequisites:** 01

**Start:** `cp -n 01-agent-loop/src/*.ts 02-tracing/src/`. The new files here are `tracer.ts` and `summarize.ts`.

## Read first

1. [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/). Skim the attribute names (`gen_ai.usage.input_tokens` and so on). You don't need OTel yet; just borrow the vocabulary.
2. Look at any `~/.claude/projects/*/*.jsonl` file on your machine. Claude Code writes its own traces as JSONL. Study the shape.

---

## The idea in plain words

When an agent fails, the question is always **"what did it see, and what did it decide?"** Logs answer that only if you record every step. The agent world uses **JSONL** traces: one JSON object per line, one line per event. JSONL is easy to append to, easy to `grep`, and easy to load into pandas or DuckDB later.

A useful trace has three levels:

```
run      (one task)         id, task, model, start/end, final status, total cost
└─ turn  (one model call)   turn #, latency, usage, stop_reason
   └─ tool (one tool call)  name, input, output size, is_error, duration
```

What to record:

| Field | Why you'll need it |
|---|---|
| `run_id`, `turn`, `ts` | To reconstruct the order of events |
| `usage` per turn | Cost per step; spotting runaway context growth |
| `stop_reason` | To see why each turn ended |
| tool `input` + output **preview** (first ~500 chars) + `output_bytes` | Debugging without huge files |
| `is_error` | Tool error rate is a harness quality metric |
| `latency_ms` | Model time vs. tool time |

**Don't log secrets.** Tool inputs can contain tokens or connection strings. Redaction is the habit you'll need at work (App Insights + PII rules apply).

The second half of observability is **looking at traces**. You'll write a small summary script. In module 09 the same data powers your experiment charts.

---

## Task

1. **`tracer.ts`**: a `Tracer` class that appends events to `traces/<run_id>.jsonl`. Events: `run_start`, `turn`, `tool_call`, `run_end`.
2. Wire it into your `agent.ts` from 01: one `turn` event per model call, one `tool_call` event per tool run.
3. **`summarize.ts`**: reads a trace file and prints:
   ```
   run 7f3a…  model=claude-opus-5-5  status=end_turn
   turns: 6   tool calls: 9 (2 errors)   total: 41,230 in / 2,114 out   $0.207
   slowest tool: bash 4.2s ("npm test")
   input tokens per turn: 3.1k → 4.0k → 6.8k → 7.2k → 9.9k → 10.2k
   ```
4. Add a simple `redact()` that masks values that look like keys (`sk-ant-…`, `Bearer …`, `password=…`).

```bash
npx tsx --env-file=.env 02-tracing/src/main.ts "find the biggest file in this repo"
npx tsx 02-tracing/src/summarize.ts traces/<run_id>.jsonl
```

### Done when

- [ ] Every run writes a `traces/<run_id>.jsonl`
- [ ] `summarize.ts` prints turns, tool calls, errors, tokens, cost and the input-token growth line
- [ ] A fake secret in a tool input appears as `***` in the trace
- [ ] You can explain from the trace alone *why* a run took as many turns as it did

<details><summary>Hint: appending lines</summary>

`fs.appendFileSync(path, JSON.stringify(event) + "\n")`. Sync is fine here; it keeps ordering simple.
</details>

<details><summary>Hint: run ids</summary>

`crypto.randomUUID()`, or a timestamp prefix so the files sort by time: `${Date.now()}-${randomUUID().slice(0, 8)}`.
</details>

## Stretch

- Query your traces with DuckDB: `SELECT tool, count(*), avg(duration_ms) FROM read_json_auto('traces/*.jsonl') WHERE type='tool_call' GROUP BY 1`. That's KQL muscle memory, applied to agents.
- Export OpenTelemetry spans, following the GenAI conventions, to a local Jaeger.
- Look at Langfuse or Arize Phoenix: what do they show that your script doesn't?

## Self-check

1. Why record an output *preview* plus a byte count rather than the full output?
2. In the input-token growth line, what does a sudden jump usually mean?

<details><summary>Answers</summary>

1. Full outputs make traces huge and can leak data. The preview is enough to debug, and the byte count shows how much context each tool added.
2. A tool returned a large output, often a `cat` of a big file or a long test log. Module 05's offloading fixes that.
</details>
