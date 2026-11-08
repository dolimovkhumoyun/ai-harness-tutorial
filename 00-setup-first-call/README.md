# 00 · Your first API call

**Goal:** talk to the model directly, with no Copilot or Claude Code in between, and understand exactly what goes in and what comes out.
**Time:** 1–2 hours · **Prerequisites:** the lab setup from the [root README](../README.md)

## Read first

1. [Messages API overview](https://platform.claude.com/docs/en/build-with-claude/working-with-messages) (15 min)
2. [Pricing](https://platform.claude.com/docs/en/about-claude/pricing). Skim it so you know what a token costs.

---

## The idea in plain words

An LLM API is a **pure function over text**:

```
request  = { model, system, messages[], tools[], max_tokens }
response = { content[], stop_reason, usage }
```

- **It has no memory.** The model remembers nothing between calls. To have a conversation, *you* resend the whole history every time. This is the most important fact in harness engineering: **the harness owns the memory.**
- **`messages` alternates roles:** `user`, `assistant`, `user`, and so on. The first message must be `user`.
- **`system`** holds standing instructions: who the model is, the rules, the context. It is sent on every call.
- **`content` is a list of blocks**, not a single string. A block can be `text`, `thinking`, `tool_use` and more. Always loop over the blocks and check `block.type`.
- **`stop_reason`** tells you *why* the model stopped:

| stop_reason | Meaning | What your code does |
|---|---|---|
| `end_turn` | The model is done | Show the answer |
| `max_tokens` | Hit your output limit mid-thought | Raise `max_tokens` or continue |
| `tool_use` | The model wants to call a tool | Run the tool, send back the result (module 01) |
| `pause_turn` | A long server-side tool turn paused | Resend to continue |
| `refusal` | The safety system declined | Read `stop_details`; don't use `content` as an answer |
| `model_context_window_exceeded` | The conversation no longer fits the context window | Compact or trim the history (module 05) |

- **`usage`** counts tokens: `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`. **Cost = tokens × price.** You'll put cost on your CV ("cut cost per task by 40%"), so learn to measure it on day one.

### Tokens, roughly

One token is about 4 characters of English, or about ¾ of a word. Code and non-English text use more tokens per character. Don't guess: the API has a free `countTokens` endpoint.

### Thinking and effort (current models)

Claude Opus 5.5 always thinks before it answers. You don't turn thinking on or off. You set **how hard it thinks**:

```ts
output_config: { effort: "low" | "medium" | "high" | "xhigh" | "max" }  // Opus 5.5 default: "medium"
```

Higher effort means better reasoning, more output tokens and more cost. You will test this as an experiment in module 09.

---

## Task: `hello.ts` → `ask.ts`

`src/hello.ts` already works. Run it first, to check your key:

```bash
npx tsx --env-file=.env 00-setup-first-call/src/hello.ts
```

Then build **`src/ask.ts`**, a tiny CLI:

```bash
npx tsx --env-file=.env 00-setup-first-call/src/ask.ts "Explain Azure Service Bus sessions in 3 bullets" --effort low
```

It should:

1. Take the question from `process.argv`, plus an optional `--effort` flag.
2. Use a system prompt that you write (for example "You are a concise senior backend engineer").
3. Print only the `text` blocks.
4. Print a footer like `stop=end_turn · in=812 · out=143 · $0.0061 · 2.3s`.
5. Handle errors with the SDK's typed errors (`Anthropic.AuthenticationError`, `Anthropic.RateLimitError`, `Anthropic.APIError`), not string matching.
6. If `stop_reason` is `refusal` or `max_tokens`, print a clear warning.

Put the cost math in **`src/cost.ts`**. Every later module will reuse it.

### Done when

- [x] `ask.ts` prints the answer and the token/cost/latency footer
- [x] `cost.ts` uses `PRICING` from `shared/config.ts` and handles cache tokens (zero for now)
- [x] Running the same question with `--effort low` and `--effort high` shows different output token counts
- [x] A bad API key prints a friendly message, not a stack trace

<details><summary>Hint: reading the flag</summary>

`const effortIdx = process.argv.indexOf("--effort")`. The value is at `effortIdx + 1`. Use `node:util`'s `parseArgs` if you want something tidier.
</details>

<details><summary>Hint: the cost formula</summary>

`(input × p.input + output × p.output + cacheRead × p.cacheRead + cacheWrite × p.cacheWrite5m) / 1_000_000`
</details>

## Stretch

- Add a multi-turn REPL mode (`--chat`): keep a `messages` array and push each user/assistant turn. Watch `input_tokens` grow on every turn, because you resend everything. This growth is *why* context engineering exists (module 05).
- Call `client.messages.countTokens(...)` before sending and compare its count with `usage.input_tokens`.
- Read about **refusal fallbacks** (the `fallbacks` parameter, beta). On current models, a production harness should handle `refusal` by retrying on a fallback model. Add it to `ask.ts`.

## Self-check

1. Why does `input_tokens` grow in a chat even when your new question is short?
2. What is the difference between `max_tokens` (the request field) and `stop_reason: "max_tokens"`?
3. Why is `response.content[0].text` a bad pattern?

<details><summary>Answers</summary>

1. The API is stateless, so every call resends the full history.
2. The field is your cap on output tokens. The stop reason means the model hit that cap and was cut off mid-answer.
3. `content` is a list of typed blocks. Block 0 might be a `thinking` or `tool_use` block, so check `type` before you read `.text`.
</details>
