# 01 · The agent loop

**Goal:** write the loop that turns a chat model into an agent. This is the step your guide calls gap #1: "You haven't written an agent loop yourself."
**Time:** 3–4 hours · **Prerequisites:** 00 (you'll reuse `cost.ts`)

## Read first

1. [Designing agentic loops](https://simonwillison.net/2025/Sep/30/designing-agentic-loops/) by Simon Willison (20 min)
2. [Agent Harness Engineering](https://addyosmani.com/blog/agent-harness-engineering/) by Addy Osmani. The "Agent = Model + Harness" framing.
3. [Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview). Read the "How tool use works" section.

---

## The idea in plain words

The model can't *do* anything. It can only *ask* you to do something. A **tool** is a function you describe to the model (name + description + JSON schema). When the model wants to use one, it replies with a `tool_use` block instead of a final answer. Your code runs the function and sends the output back as a `tool_result`. Then you call the model again.

That repetition is the **agent loop**:

```
          ┌──────────────────────────────────────────────┐
          │                                              │
user ──▶ [ call model ] ──stop_reason?──┬── end_turn ──▶ done, print answer
                ▲                       │
                │                       └── tool_use
                │                              │
                │                   run each tool_use block
                │                              │
                └──── append assistant msg + user msg with tool_result(s)
```

The whole agent is roughly this:

```ts
while (turns++ < MAX_TURNS) {
  const res = await client.messages.create({ model, system, tools, messages });
  messages.push({ role: "assistant", content: res.content });   // the FULL content, unchanged
  if (res.stop_reason !== "tool_use") break;
  const results = await Promise.all(toolUses(res).map(runTool)); // may be several
  messages.push({ role: "user", content: results });             // ALL results in ONE message
}
```

Four rules that trip everyone up:

1. **Append `res.content` as is.** It contains `thinking` blocks the API needs back, unchanged. Don't rebuild it from the text.
2. **Every `tool_use` needs a matching `tool_result`** with the same `tool_use_id`, or the next call fails with a 400.
3. **Several tool calls can come in one turn** (parallel tool use). Return all the results in **one** user message.
4. **Errors are results, not exceptions.** If a tool fails, return `{ type: "tool_result", is_error: true, content: "ENOENT: no such file …" }`. The model reads the error and tries something else. Crashing the loop teaches it nothing.
   **DeepSeek note:** DeepSeek ignores `is_error`, so start the content with `ERROR: ` as well.

### Key terms

- **Turn**: one model call plus the tool runs that follow it.
- **Tool schema**: JSON Schema for the tool's input. The model fills it in.
- **MAX_TURNS**: a hard cap so a confused agent can't loop forever and burn money.

---

## Task: a coding agent with two tools

Files (in `src/`):

- `tools.ts`: tool **definitions** and an **executor**. You implement `read_file` and `bash`.
- `agent.ts`: the **loop**. You implement `runAgent(task)`.
- `main.ts`: the CLI entry point. It already works once the other two are done.

```bash
npx tsx --env-file=.env 01-agent-loop/src/main.ts "How many TypeScript files are in this repo, and what does shared/config.ts export?"
```

Requirements:

1. `read_file({ path })` returns the file's contents. If the file is missing, return an `is_error` result.
2. `bash({ command })` runs the command with `child_process.exec`, a 30 s timeout and a working directory you choose. It returns stdout, stderr and the exit code. ⚠️ Until module 04 gives you a sandbox, **ask y/N in the terminal before every command.**
3. The loop prints each step as it goes: `→ bash: ls -la` / `← (exit 0, 1.2 KB)`.
4. Stop on `end_turn`, `MAX_TURNS`, `refusal` or `max_tokens`, and print why.
5. At the end, print the total turns, tokens and cost (use your `cost.ts` from 00, copied in).

### Done when

- [ ] The agent answers a question that needs at least 2 tool calls
- [ ] Asking for a missing file → the agent sees the error and recovers (for example it runs `ls` to find the right name)
- [ ] Parallel tool calls work (ask "read package.json and tsconfig.json")
- [ ] It never runs a bash command you didn't approve
- [ ] The final summary shows turns / tokens / cost

<details><summary>Hint: picking out the tool_use blocks</summary>

```ts
const toolUses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
```
</details>

<details><summary>Hint: y/N prompt</summary>

`import * as readline from "node:readline/promises"` then `const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); const ans = await rl.question("run? [y/N] ")`.
If the user declines, return a tool_result like "User declined to run this command." The model will adapt.
</details>

<details><summary>Hint: large outputs</summary>

`cat` on a big file can return 100 KB. For now, cut tool output at about 10,000 characters and say it was cut. Module 05 does this properly.
</details>

## Stretch

- Switch to `client.messages.stream(...)` and print text as it arrives. Use `await stream.finalMessage()` to get the full message for the loop.
- Rewrite the same agent with the SDK's **Tool Runner** (`client.beta.messages.toolRunner` + `betaZodTool`) and compare: what did it do for you, and what control did you lose?
- Read OpenCode's agent loop in its source and find the equivalent of your `while`.

## Self-check

1. Why must tool errors go back to the model instead of being thrown?
2. What happens if you return 2 results for 3 `tool_use` blocks?
3. Why is `MAX_TURNS` a *cost* control and not just a bug guard?

<details><summary>Answers</summary>

1. The model can only fix what it can see. A thrown error ends the run, while a returned error lets the agent change course.
2. The next API call fails with a 400, because every tool_use needs a matching tool_result.
3. Every turn resends the whole history, so cost grows roughly with the square of the number of turns. A stuck loop gets expensive fast.
</details>
