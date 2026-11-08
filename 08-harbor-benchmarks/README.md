# 08 · Benchmarks with Harbor

**Goal:** run real agent benchmarks (Terminal-Bench 2.0), port your own tasks to the industry format, and plug **your** harness in as an agent. This is the guide's week-3 work, and its Python gap.
**Time:** 5–8 hours · **Prerequisites:** 07, Docker, Python 3.12+, [`uv`](https://docs.astral.sh/uv/)

## Read first

1. [Terminal-Bench 2.0 announcement](https://www.tbench.ai/news/announcement-2-0). What the benchmark measures and why tasks are containers.
2. [Harbor README](https://github.com/harbor-framework/harbor) and its docs: *Create a task* and *Custom agents*.
3. Open 3 Terminal-Bench tasks on GitHub and read each `instruction.md`, `tests/` and `solution/`. You'll learn more from these than from any blog post.

---

## The idea in plain words

**Harbor** is the module 07 runner, built by people who run benchmarks for a living: containerized tasks, parallel runs, many agents (Claude Code, OpenCode, Codex…), cloud sandboxes and result tracking. **Terminal-Bench** is a dataset of hard terminal tasks in Harbor's format.

A Harbor task maps almost one-to-one onto your module 07 tasks:

```
your 07 task            Harbor task
─────────────           ───────────────────────────────
task.json prompt   →    instruction.md
task.json config   →    task.toml (timeouts, metadata)
workspace/         →    environment/Dockerfile  (bakes in the starting files)
solution/          →    solution/solve.sh       (the "oracle" agent runs this)
grader/            →    tests/test.sh           (writes 1 or 0 to /logs/verifier/reward.txt)
```

Two kinds of agent:

- **Installed agent** (`BaseInstalledAgent`): Harbor installs your agent's CLI *inside* the task container and runs it there. The container *is* the sandbox. This is what Harbor recommends.
- **External agent** (`BaseAgent`): the loop runs outside and acts through `environment.exec(...)`.

Your harness is a TypeScript CLI, so the installed agent fits. It needs one change: a **local executor** mode, because inside Harbor it shouldn't start Docker-in-Docker. Commands run directly in the container it's already in. That is a good design lesson in itself: **hide the sandbox behind an interface** (`Executor` with `DockerExecutor` and `LocalExecutor` implementations).

---

## Task

### Part A: run the real thing (about 1 h)

```bash
uv tool install harbor
harbor datasets list
harbor run --help                                  # find the flags for picking a subset of tasks
harbor run -d terminal-bench@2.0 -a oracle         # on ~5 tasks first: the oracle must score 100%
harbor run -d terminal-bench@2.0 -a claude-code -m anthropic/claude-opus-5-5 --ae ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
```

Open the job output folder. Find the trajectory, the verifier output and the reward for each task. Write 3 sentences on why one task failed.

### Part B: port your tasks (about 2 h)

1. `harbor task init fix-order-pricing` inside `08-harbor-benchmarks/tasks/`, then port the module 07 task: the Dockerfile copies the starting files in, `solve.sh` applies the fix, and `test.sh` runs `node --test` and writes the reward.
2. Run it with `-a oracle` (must pass) and then with `-a claude-code`.
3. Port at least 5 of your 10 module 07 tasks.

### Part C: your harness as a Harbor agent (2–4 h)

1. In your harness, add an `Executor` interface and a `LocalExecutor`, plus a CLI flag `--executor local`.
2. Make your CLI print a final JSON line, `{"turns":…, "input_tokens":…, "output_tokens":…, "cost_usd":…}`, so Harbor can collect usage.
3. Fill in `agent/mini_harness_agent.py`: `install()` sets up Node and your harness; `run()` calls it with the instruction.
4. Run it on your ported tasks and on 5 Terminal-Bench tasks. Compare it with `claude-code` on the **same tasks, same model**.

```bash
PYTHONPATH=08-harbor-benchmarks/agent harbor run -p 08-harbor-benchmarks/tasks \
  -a mini_harness_agent:MiniHarnessAgent -m anthropic/claude-opus-5-5 \
  --ae ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
```

### Done when

- [ ] Oracle = 100% on your ported tasks
- [ ] A results table: your harness vs. claude-code on ≥10 tasks (pass rate, cost if available)
- [ ] `NOTES.md` here: 3 failure analyses ("the trace shows the agent … because …")

<details><summary>Hint: getting your harness into the container</summary>

The easiest route: push your harness to GitHub (it's your project 1 repo anyway), then in `install()` run `npm install -g github:<you>/<repo>`. Your package.json needs a `bin` entry and a build step. Bundling to one JS file with `esbuild` keeps the install fast. Check `BaseEnvironment` in Harbor's source for a way to upload a local file instead.
</details>

<details><summary>Hint: Node inside the task image</summary>

Task images differ. Many are Debian/Ubuntu-based. In `install()`, use `exec_as_root` to install Node (for example via NodeSource or a static tarball) when `node -v` fails.
</details>

## Stretch

- Run with `--n-concurrent 4` and note what breaks (rate limits? flaky tasks?).
- Submit one of your tasks upstream, or contribute a fix to Harbor. That's public open-source work for your CV.

## Self-check

1. Why does Harbor insist on an oracle run?
2. Why is "the container is the sandbox" fine for benchmarks but not for your laptop?

<details><summary>Answers</summary>

1. It proves each task is solvable and its tests are correct. Otherwise a failing task might be the task's fault, not the agent's.
2. The task container is disposable and isolated by design. Your laptop holds your keys, SSH config and repos.
</details>
