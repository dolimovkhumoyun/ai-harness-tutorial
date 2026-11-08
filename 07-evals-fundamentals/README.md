# 07 · Evals fundamentals

**Goal:** prove with numbers whether a harness change helped. Your guide calls this **the biggest gap, and the skill employers probe hardest.**
**Time:** 5–6 hours · **Prerequisites:** 06 (your agent can now verify its own work)

## Read first

1. [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (Anthropic)
2. [Your AI product needs evals](https://hamel.dev/blog/posts/evals/) by Hamel Husain. A practical, opinionated read.
3. [Evaluating LLMs trained on code](https://arxiv.org/abs/2107.03374), section 2.1 only. Where the pass@k formula comes from.

---

## The idea in plain words

An **eval** is an automated test suite for an agent. The agent is **non-deterministic**, though: the same task can pass once and fail the next time. So evals are closer to *experiments* than to unit tests.

### The anatomy of an eval task

```
task/
├── task.json        id, prompt, timeouts, tags
├── workspace/       the starting state (repo, files) → copied fresh for every attempt
└── grader           how to decide pass/fail → runs AFTER the agent, in the same sandbox
```

### Three kinds of grader, best first

| Grader | Example | When to use it |
|---|---|---|
| **Code-based** | `node --test` exits 0; a file contains X; the JSON validates | Whenever possible: cheap, fast, deterministic |
| **LLM-as-judge** | "Does this summary mention the root cause? yes/no", with a rubric | Fuzzy outputs (explanations, reports) |
| **Human** | You review 20 transcripts | To calibrate the other two, and early on |

**Grade the outcome, not the path.** Check "tests pass and the test files are unchanged". Don't check "it ran `npm test` 3 times". Agents find valid paths you didn't think of.

### Metrics

- **Pass rate**: passed attempts ÷ attempts.
- **pass@k**: the chance that **at least one** of k attempts passes. Use it for "can it ever do this?"
- **pass^k** (pass-hat-k): the chance that **all** k attempts pass. Use it for "is it *reliable*?" This one matters for production agents like your order-flow troubleshooter.
- **Cost per task** and **turns per task**. A change that adds 2% pass rate at 3× the cost is often a bad trade.

With n attempts of which c passed, the unbiased estimator is:

```
pass@k = 1 − C(n−c, k) / C(n, k)
pass^k ≈ C(c, k) / C(n, k)
```

### Noise: the trap everyone falls into

With 10 tasks × 1 attempt, a single lucky run moves the pass rate by 10 points. **Run each task several times (k = 3 to 5)** and report the spread. If two configurations differ by less than the noise, you haven't learned anything yet. Say so in your write-up; it signals maturity.

### Two kinds of suite

- **Capability evals**: hard tasks you mostly fail today. They show progress.
- **Regression evals**: tasks you pass today. They catch breakage when you change the harness.

---

## Task: your own mini eval runner (TypeScript)

You'll replace it with Harbor in module 08. Building one yourself first means you'll understand what Harbor does for you.

1. **`metrics.ts`**: `passAtK(n, c, k)` and `passHatK(n, c, k)`. Make `metrics.test.ts` pass.
2. **`runner.ts`**: for each task in `tasks/` and each attempt 1..k:
   - copy `workspace/` into a fresh temp dir
   - run **your agent from module 06** with the task prompt, in a sandbox on that dir
   - run the grader command in the same sandbox and record pass/fail
   - append a line to `results/<runId>.jsonl`: task, attempt, passed, turns, cost, duration, trace file
3. **`report.ts`**: read the results and print a per-task table plus totals (pass rate, pass@1, pass@3, pass^3, mean cost, mean turns).
4. **Write 10 tasks** in your domain. `tasks/fix-order-pricing/` is complete; use it as the template. Ideas:
   - Node bug fixes: an off-by-one in pagination, a missing `await`, wrong date handling across time zones, an unhandled promise rejection
   - A toy **Azure Functions v3 → v4** migration: convert `function.json` + `module.exports` into an `app.http(...)` registration. The grader is a node script that checks the new structure and calls the handler with a fake request.
   - A dependency upgrade: change an API call to its new signature
   - "Add input validation to this handler; the hidden tests check 400 responses"
5. Run the baseline: **10 tasks × 3 attempts**. Save the numbers. You'll beat them in module 09.

```bash
npx tsx --env-file=.env 07-evals-fundamentals/src/runner.ts --k 3
npx tsx 07-evals-fundamentals/src/report.ts 07-evals-fundamentals/results/<runId>.jsonl
```

### Done when

- [ ] `metrics.test.ts` passes
- [ ] The runner gives every attempt a clean workspace (no leakage between attempts)
- [ ] 10 tasks, each with a code-based grader you've checked **fails before and passes after** a correct fix
- [ ] A baseline report with pass@1, pass^3, cost and turns
- [ ] You can explain why your 10-task numbers are noisy

<details><summary>Hint: validating your graders</summary>

For every task, keep a `solution.patch` (or a `solution/` folder) outside the agent's workspace. Your runner gets a `--oracle` mode that applies the solution instead of running the agent; every task must pass in that mode. Harbor calls this the **oracle** agent. Run your graders on the untouched workspace too; they must fail. A grader that passes on the broken code measures nothing.
</details>

<details><summary>Hint: hidden tests</summary>

If the agent can see the grader's tests, it may special-case them. Keep the grader's tests outside `workspace/` and copy them in only *after* the agent finishes.
</details>

## Stretch

- Add an LLM-judge grader for one "explain the bug" task. Then label 10 outputs by hand and measure how often the judge agrees with you.
- Run attempts in parallel (with a concurrency limit, so you stay under rate limits).
- Add a `--tags` filter so you can run just `migration` tasks.

## Self-check

1. A task passes 2 of 5 times. What are pass@1, pass@5 and pass^5, roughly?
2. Why must graders be tested to *fail* on the starting workspace?
3. Your change improves the pass rate from 60% to 65% on 10 tasks × 1 attempt. What do you conclude?

<details><summary>Answers</summary>

1. pass@1 = 0.4. pass@5 = 1, since with n = k = 5 and c = 2 at least one attempt passed. pass^5 = 0, because not all 5 passed.
2. Otherwise the grader might pass without any fix being made, and your pass rate would be inflated.
3. Nothing yet. 5% is half of one task. Run more attempts and tasks before you claim an improvement.
</details>
