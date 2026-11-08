# 05 · Context engineering

**Goal:** control what the model sees, so long tasks stay accurate and cheap. The guide calls this gap #3: compaction, token budgets, prompt caching.
**Time:** 5–6 hours (do it over two sessions) · **Prerequisites:** 04

**Start:** `cp -n 04-sandbox-permissions/src/*.ts 05-context-engineering/src/`. The new files are `offload.ts`, `offload.test.ts`, `compact.ts` and `agents-md.ts`.

## Read first

1. [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) (Anthropic). The core reading.
2. [Context Rot](https://research.trychroma.com/context-rot) (Chroma research). Why "it fits in 1M tokens" doesn't mean "it works at 1M tokens".
3. [Prompt caching docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
4. [agents.md](https://agents.md). The open convention for project instruction files.

---

## The idea in plain words

The context window is the model's **working memory**. It is large (1M tokens on current models) but not free:

- **Cost:** you pay for every input token on every turn.
- **Accuracy:** the more irrelevant tokens there are, the worse the model finds what matters ("context rot").
- **Latency:** more input tokens means a slower response.

Context engineering is the job of putting **the smallest set of high-signal tokens** in front of the model at every step. You have four tools for it:

### 1. Offloading big tool outputs

A `npm test` log can be 80 KB. Don't put it all in context. Keep the **head and the tail** (errors usually sit at the end), save the full output to a file, and tell the model where it is:

```
[output truncated: 81,204 chars → kept first 2,000 + last 4,000]
[full output saved to .agent/out/turn7-bash.txt. Use search or read_file with a range to see more]
...head...
...tail...
```

### 2. Compaction (summarize and restart)

When the conversation nears your token budget, ask the model to write a **handoff summary** (goal, decisions made, files changed, current state, next steps). Then start a fresh conversation: `[system] + [user: "Summary of work so far: … Continue."]`.

⚠️ **The current-API rule: keep history append-only.** On Claude Opus 5.5 and other current models, `thinking` blocks are bound to the exact conversation prefix that produced them. If you **edit or delete earlier messages** and resend the thinking blocks that came after them, the API rejects the request with a 400 (this is enforced by default on newer accounts). So:

- ✅ Truncate a tool output **when you create** its `tool_result`, before it enters history.
- ✅ Simple compaction: replace the **whole** history with one summary message. No old thinking blocks are replayed, so nothing breaks.
- ✅ Or use **server-side compaction** (beta `compact-2026-01-12`; the API summarizes for you and returns a `compaction` block that you append back).
- ❌ Don't go back and shrink old `tool_result`s in place, and don't splice summaries into the middle of history.
- ❌ Don't change `system` mid-session. Append a `{ role: "system" }` message instead (supported on Opus 5.5).

This rule also helps caching, and caching is where the money is.

### 3. Prompt caching

The API can cache a **prefix** of your request. The order is `tools → system → messages`. Cache reads on Opus 5.5 cost **0.05×** the normal input price. In an agent loop, where each turn resends the previous turns, that's an enormous saving, **if** the prefix stays byte-identical.

```ts
await client.messages.create({ ..., cache_control: { type: "ephemeral" } }); // auto-cache the last block
// check: response.usage.cache_read_input_tokens should be > 0 from turn 2 on
```

Silent cache killers: a timestamp in the system prompt, tools in random order, `JSON.stringify` of an object with unstable key order, editing history (see above).

**DeepSeek note:** DeepSeek ignores `cache_control` and caches repeated prefixes automatically (cache hits cost about 2% of normal input). Every caching rule above still applies: a stable, append-only prefix is what produces cache hits. Measure hits with `usage.cache_read_input_tokens`. Server-side compaction and context editing are Claude-only, so skip those stretch items.

### 4. Project instructions (AGENTS.md)

You did this already, with MIGRATION.md as shared context and your SafarSIM subagents. Now load it yourself: read `AGENTS.md` from the workspace and put it into the **system prompt at session start**. Keep it short. HumanLayer's rule: every line in it costs tokens on every turn, so it has to earn its place.

---

## Task

1. **`offload.ts`**: `offload(output, { maxChars, headChars, tailChars, saveDir })`. Make `offload.test.ts` pass, then apply it to every tool result in the loop.
2. **Token budget**: after each turn, read `usage.input_tokens` (plus the cache tokens). If it goes over `COMPACT_AT` (say 60,000, set low so you can test it), compact.
3. **`compact.ts`**: `compact(messages) → MessageParam[]` asks the model for a structured handoff summary and returns a fresh one-message history. Log `compaction` events to the trace (tokens before → after).
4. **Caching**: add `cache_control`, then show `cache_read_input_tokens` from your traces on turns 2+ in the summary script.
5. **`agents-md.ts`**: load `AGENTS.md` from the workspace (if it exists) into the system prompt at session start.
6. Test it on a long task. For example, give the agent a workspace with a 30-file toy project: *"Add JSDoc to every exported function in this project"*. Watch the compactions happen in the trace.

### Done when

- [ ] `offload.test.ts` passes
- [ ] A long task triggers at least 1 compaction and still finishes correctly
- [ ] Turns 2+ show cache reads; you can name the cache hit rate for a run
- [ ] History is append-only (no code path edits an earlier message)
- [ ] An AGENTS.md rule ("always use pnpm") visibly changes the agent's behavior

<details><summary>Hint: a good handoff-summary prompt</summary>

"You are handing this task to a fresh engineer who has none of this conversation. Write: 1) the original goal, verbatim; 2) what is done, with file paths; 3) decisions and why; 4) what failed and should not be retried; 5) the exact next step." Then check that the summary keeps the original task. Losing the goal is the classic compaction bug.
</details>

<details><summary>Hint: measuring the cache hit rate</summary>

`hit = cache_read / (cache_read + cache_creation + input_tokens)` per turn. Turn 1 is always 0.
</details>

## Stretch

- Try **server-side compaction** (`client.beta.messages.create` with `betas: ["compact-2026-01-12"]` and `context_management: { edits: [{ type: "compact_20260112" }] }`). Compare the quality of its summaries with yours.
- Try **context editing** (`clear_tool_uses_20250919`). It clears old tool results server-side, without breaking your append-only history.
- Add a `memory.md` file that the agent can write to with a `remember` tool and that survives compactions.

## Self-check

1. Why keep the *tail* of a test log rather than only the head?
2. Why does editing an old `tool_result` break two things at once?
3. What should never go in a cached system prompt?

<details><summary>Answers</summary>

1. Test runners and compilers print failures and summaries at the end.
2. It invalidates the thinking blocks that came after it (a 400 on current models), and it invalidates the prompt cache from that point on.
3. Anything that changes between requests: timestamps, request ids, per-user data. Put volatile content after the last cache breakpoint.
</details>
