# 09 · Harness experiments

**Goal:** change one thing, measure, and publish. This is portfolio **project 3**. It produces the CV line *"raised pass rate from X% to Y% on a 30-task suite by changing tool descriptions and adding a typecheck hook."*
**Time:** 6–10 hours, spread over a week (runs take time and money) · **Prerequisites:** 07 (or 08)

## Read first

1. Re-read the *Metrics* and *Noise* sections of [07](../07-evals-fundamentals/README.md).
2. [Raising the bar on SWE-bench Verified](https://www.anthropic.com/engineering/swe-bench-sonnet) (Anthropic). How a small harness is described and evaluated.
3. Any one Terminal-Bench leaderboard write-up. Notice how they report harness changes.

---

## The idea in plain words

This is A/B testing for agents. The scientific method in five lines:

1. **Hypothesis:** "Adding 'when to use' guidance to tool descriptions reduces tool errors and raises the pass rate."
2. **One variable.** Everything else stays fixed: model, effort, tasks, k, max turns.
3. **Baseline vs. variant**, on the same tasks with the same k.
4. **Metrics:** pass rate (with spread), pass^k, cost/task, turns/task, tool error rate.
5. **Conclusion, including "no effect" or "inside the noise".** Negative results are still results.

### Make the harness configurable first

Every variable becomes a config flag, so experiments don't need code edits:

```ts
interface HarnessConfig {
  toolDescriptions: "minimal" | "detailed";
  agentsMd: boolean;
  compactAt: number;            // tokens
  postEditTypecheck: boolean;
  stopHookTests: boolean;
  effort: "low" | "medium" | "high" | "xhigh";
  offloadMaxChars: number;
}
```

### Good first experiments (from your guide)

| # | Variable | Baseline → variant | What you expect |
|---|---|---|---|
| E1 | Tool descriptions | minimal → detailed with "when to use" | fewer tool errors, fewer turns |
| E2 | AGENTS.md | off → on | better at repo conventions |
| E3 | Compaction threshold | 30k → 120k | cost vs. accuracy trade-off |
| E4 | Typecheck hook | off → on | higher pass rate, slightly more turns |
| E5 | Effort | low → medium → high | pass rate vs. cost curve |

### Reporting honestly

- Report **mean ± spread** (min–max across repeated runs, or a bootstrap 95% interval).
- Show **per-task** changes: an average can hide one task that broke.
- Put **cost** next to every accuracy number.

---

## Task

1. Add `HarnessConfig` (see `src/config.ts`) to your harness and to your module 07 runner (`--config configs/e1-detailed.json`).
2. Run E1 and E4 at minimum, on ≥10 tasks with k = 3 (ideally grow to 20–30 tasks).
3. **`src/compare.ts`**: takes two results files and prints a comparison table (per task and overall: pass rate, pass^3, cost, turns, tool errors) plus a verdict ("improved / no clear difference / worse").
4. Make a chart: pass rate vs. cost per configuration. Any tool works (an HTML page with Chart.js, matplotlib, or a spreadsheet).
5. Write it up in **`WRITEUP.md`** with the template: hypothesis, setup, results, what surprised you, what's next. Publish it as a blog post or a README in your public repo.

### Done when

- [ ] Experiments run from config files, with no code edits between runs
- [ ] At least 2 experiments, each with a baseline and a variant on identical tasks and k
- [ ] `compare.ts` output and a chart
- [ ] A published write-up with honest uncertainty

<details><summary>Hint: a cheap bootstrap interval</summary>

Resample tasks with replacement 1,000 times, compute the pass rate each time, sort the results, and take the 2.5th and 97.5th percentiles. About 15 lines of TypeScript.
</details>

<details><summary>Hint: keep costs down</summary>

Develop the experiment on `claude-haiku-5-5` with 3 tasks. Do the final run on your main model. Never compare results across models.
</details>

## Self-check

1. You changed tool descriptions *and* AGENTS.md together, and the pass rate rose. What can you claim?
2. E5 shows `high` effort is +4% pass rate at 2.5× cost. How would you decide?

<details><summary>Answers</summary>

1. Only that the combination helped. Run them separately to know which one did it.
2. It depends on the cost of failure. For the order-flow agent, a wrong root cause wastes an engineer's hour, so +4% may be worth it. For bulk lint fixes, probably not. Say this explicitly in the write-up.
</details>
