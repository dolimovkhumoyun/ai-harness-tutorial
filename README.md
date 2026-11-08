# AI Engineer Lab

Your hands-on companion to the guide **"Becoming an AI Harness Engineer — Personal Guide"**.

Each folder is one topic. Every topic has:

- **A short lesson** (`README.md`): the concept in plain words, a diagram, key terms, and 2–3 things to read.
- **A practical task**: you implement it yourself, inside that folder.
- **Starter files** with `TODO`s. They compile, but don't do anything yet. That's your job.
- **A done checklist, hints (hidden until you open them), stretch goals and self-check questions.**

No solutions are included on purpose. When you finish a task (or get stuck), ask Claude:
*"Review my 03-tool-design implementation"* or *"I'm stuck on the compaction step in 05"*.

---

## The path

The topics follow the guide's roadmap. Modules 01–06 grow **one harness** step by step, which is portfolio **project 1** ("mini harness from scratch").

| # | Topic | You build | Guide phase | Time |
|---|---|---|---|---|
| [00](00-setup-first-call/) | First API call | A CLI that calls Claude and prints the token cost | Week 1 | 1–2 h |
| [01](01-agent-loop/) | The agent loop | A loop with `read_file` + `bash` tools | Week 1 | 3–4 h |
| [02](02-tracing/) | Observability | JSONL traces + a trace summary script | Week 1 | 2–3 h |
| [03](03-tool-design/) | Tool design | `edit_file` + `search`, errors the model can learn from | Week 2 | 3–4 h |
| [04](04-sandbox-permissions/) | Sandbox & permissions | bash inside Docker + a permission gate | Week 2 | 3–5 h |
| [05](05-context-engineering/) | Context engineering | Token budget, output offloading, compaction, caching, AGENTS.md | Week 2 | 5–6 h |
| [06](06-hooks-verification/) | Hooks & verification | Post-edit typecheck/test hooks that feed errors back | Week 2 | 3–4 h |
| [07](07-evals-fundamentals/) | Evals fundamentals | Your own mini eval runner: tasks, graders, pass rate | Week 3 | 5–6 h |
| [08](08-harbor-benchmarks/) | Benchmarks with Harbor | Terminal-Bench style tasks; wrap your harness for Harbor (Python) | Week 3 | 5–8 h |
| [09](09-harness-experiments/) | Harness experiments | One-variable experiments, charts, a write-up | Week 4 / project 3 | 6–10 h |
| [10](10-mcp/) | MCP | An MCP server and an MCP client inside your harness | Phase 3 prep | 4–6 h |
| [11](11-orchestration/) | Orchestration & subagents | A planner, worker subagents and an evaluator | Phase 3 prep | 4–6 h |
| [12](12-security/) | Agent security | Prompt-injection tests + defenses | Any time after 04 | 3–4 h |
| [13](13-capstones/) | Capstones | Briefs for the flagship order-flow agent + Snyk harness | Phases 3–4 | weeks |

**Suggested pace** (matches the guide's 8–10 h/week): weeks 1–2 → 00–06, week 3 → 07–08, week 4 → 09, then 10–12 before the flagship.

---

## One-time setup

```bash
cd ai-engineer-lab
npm install
cp .env.example .env    # then put your DeepSeek key in LLM_API_KEY
npm run check           # typecheck everything
```

Run any module's code with:

```bash
npx tsx --env-file=.env 00-setup-first-call/src/hello.ts
```

- **Node 20+** is required (for `--env-file`). Your shell's lazy `nvm` wrapper may break `node`. If it does, run `nvm use 22` first.
- **Docker** is needed from module 04 on. **Python 3.12+ and `uv`** are needed for module 08.
- **Model:** `shared/config.ts` sets the model for every module (`deepseek-flash`). Keep it fixed inside one experiment.
- **Always create the client with `createClient()` from `shared/client.ts`**, never `new Anthropic()`. The bare constructor reads `ANTHROPIC_*` variables from your shell (Claude Code sets them), and those win over `.env`. Your key could end up sent to the wrong server.

## Using DeepSeek

The lab uses the Anthropic SDK pointed at **DeepSeek's Anthropic-compatible API** (`https://api.deepseek.com/anthropic`). The code and concepts are the same, but DeepSeek handles some fields differently ([full table](https://api-docs.deepseek.com/guides/anthropic_api)). The ones that matter here:

| Feature | On DeepSeek | What to do in the lab |
|---|---|---|
| `tool_result.is_error` | **Ignored** | Also start error text with `ERROR:` so the model sees the failure (01, 03) |
| `strict: true` on tools | Not documented | Validate tool inputs yourself with zod before running them (03) |
| `cache_control` | Ignored; caching is **automatic** for repeated prefixes | Skip `cache_control`, keep the prefix stable, and check `cache_read_input_tokens` (05) |
| Server-side compaction / context editing (betas) | Not available | Use client-side compaction only (05) |
| `output_config` | Only `effort` is supported | Fine for 00 and 09 |
| `thinking` blocks | Supported | Append `response.content` unchanged, as taught |
| Refusal fallbacks, mid-conversation system messages | Claude-specific | Skip those stretch items |
| Pricing | Off-peak / peak (2×) | Costs from `PRICING` are a lower bound |

Readings that link to Claude docs still teach the concepts correctly. Just check DeepSeek's docs before relying on a specific API field.

## How modules build on each other

Modules 01–06 continue the same agent. Begin each one by copying your previous `src/` in:

```bash
cp -n 01-agent-loop/src/*.ts 02-tracing/src/   # -n: never overwrite the new starter files
```

Each module's README tells you which files are new.

## Progress

- [ ] 00 First API call
- [ ] 01 Agent loop
- [ ] 02 Tracing
- [ ] 03 Tool design
- [ ] 04 Sandbox & permissions
- [ ] 05 Context engineering
- [ ] 06 Hooks & verification → **publish project 1 repo**
- [ ] 07 Evals fundamentals
- [ ] 08 Harbor benchmarks
- [ ] 09 Harness experiments → **publish write-up #1**
- [ ] 10 MCP
- [ ] 11 Orchestration
- [ ] 12 Security
- [ ] 13 Capstones

## Glossary

A one-page cheat sheet of every term used here: [GLOSSARY.md](GLOSSARY.md).
