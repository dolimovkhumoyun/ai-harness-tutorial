# 11 · Orchestration & subagents

**Goal:** know when one agent isn't enough, and build the two patterns that matter: **subagents for context isolation**, and **planner → workers → evaluator**.
**Time:** 4–6 hours · **Prerequisites:** 05, 06 (and 07 to measure)

## Read first

1. [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) (Anthropic). Workflows vs. agents, and the five workflow patterns.
2. [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) (Anthropic)
3. [Don't build multi-agents](https://cognition.ai/blog/dont-build-multi-agents) (Cognition). The counter-argument. Read both sides.

---

## The idea in plain words

**First question: do you need an agent at all?** Many "agent" problems are really **workflows**: fixed steps you control in code (prompt chaining, routing, parallel fan-out). Workflows are cheaper, faster and easier to test. Use an agent when the steps can't be known in advance.

### Pattern 1: subagents for context isolation

A main agent that greps 40 files to answer one question fills its context with junk. Instead, it **delegates**: a subagent with a **fresh, empty context** does the messy exploration and returns only a short answer.

```
main agent (context stays clean)
  └─ delegate("Find where order status transitions are validated; return file:line + 3-line summary")
        subagent: own messages[], own tools (read-only!), own MAX_TURNS, cheaper model
        … 15 tool calls, 60k tokens of grep output …
        returns: "src/orders/fsm.ts:42 validateTransition() …"   ← ~200 tokens
```

The key design decisions:

- **What the subagent gets:** a self-contained task description. It sees *none* of the parent's history.
- **What it may do:** usually read-only tools. Writes stay with the parent, so there's one place where changes happen.
- **What it returns:** a short, structured result. Ask for that format explicitly.
- **Which model it uses:** routing cheap exploration to `claude-haiku-5-5` or `claude-sonnet-5-5` is a real cost lever.

### Pattern 2: planner → workers → evaluator

```
planner   : task → a list of independent subtasks (structured JSON)
workers   : run in parallel, one subagent each
evaluator : checks the combined result against the original task (tests + LLM judge) → accept, or send back with feedback
```

Your Azure Functions migration is the textbook case: plan per function app, migrate each in parallel, then verify with build + tests.

### When multi-agent hurts

Parallel workers that make **conflicting decisions** (two workers each pick a different date library) produce incoherent results. Cognition's rule: share full context, or keep the work on one thread. Split only work that is truly independent (reading and research), and keep writes and decisions in one place.

---

## Task

1. **`subagent.ts`**: a `delegate({ task, returnFormat })` tool for your main agent. It runs your loop recursively with its own `messages`, **read-only tools only**, `maxTurns: 10` and a configurable model. Trace subagent runs as children (`parent_run_id`).
2. **Measure context isolation.** Pick a "survey" task, for example *"List every place this repo reads environment variables and what each is for"* on a medium-sized repo (clone any open-source TypeScript project). Run it with delegation off vs. on, and compare the main agent's peak `input_tokens`, total cost and answer quality.
3. **`orchestrator.ts`**: planner → parallel workers (`Promise.all`, with a concurrency limit) → evaluator, for a *"Migrate these 3 toy Azure Functions from v3 to v4"* task (reuse your module 07 migration tasks).
4. Write down in this folder: one case where delegation helped, one where it hurt, and why.

### Done when

- [ ] The main agent's peak context is visibly smaller with delegation on the survey task
- [ ] Subagents can't write (enforced in the tool list, not the prompt)
- [ ] Traces show the parent/child structure
- [ ] The orchestrator completes the 3-function migration with evaluator feedback at least once
- [ ] You can explain workflow vs. agent vs. multi-agent in an interview, with your own numbers

<details><summary>Hint: structured planner output</summary>

Use structured outputs (`output_config: { format: { type: "json_schema", schema } }`), or the SDK's `client.messages.parse()` with a zod schema, so the plan is guaranteed to be valid JSON: `{ subtasks: [{ id, description, files }] }`.
</details>

## Stretch

- Let the planner choose the model per subtask (cheap for reading, strong for tricky edits).
- Compare with Claude Code's subagents or the Agent SDK's subagents: what do they pass to the child, and what comes back?

## Self-check

1. What exactly does a subagent buy you, in one word?
2. Why keep writes in the parent?
3. When should a "multi-agent system" just be a `for` loop?

<details><summary>Answers</summary>

1. Isolation: of context, permissions and cost.
2. One coherent decision-maker avoids conflicting edits and makes verification simple.
3. When the steps are known in advance and independent. That's a workflow, so write it as code.
</details>
