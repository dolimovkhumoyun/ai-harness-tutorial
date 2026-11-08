# 13 · Capstones

Two portfolio projects from your guide. Everything from modules 00–12 comes together here. These are **briefs, not lessons**: you design them. Each has its own folder for notes and code (or a link to the real repo).

---

## Capstone A: order-flow troubleshooting agent (flagship, project 4)

**Folder:** [`order-flow-agent/`](order-flow-agent/) · **Time:** 4–6 weeks · **Uses:** 05, 06, 07, 10, 11, 12

**Problem.** An order is stuck. Today an engineer queries App Insights (KQL), Fluent (GraphQL), Postgres and Mongo by hand to find out why. The agent does that investigation and returns a root cause with evidence.

**Architecture.**

```
engineer: "ORD-123 stuck since Tuesday"
   │
harness (yours) ── system prompt: role + symptom playbooks (resources)
   ├─ MCP: app-insights   (KQL, read-only, time-boxed queries, row caps)
   ├─ MCP: fluent         (GraphQL queries only, no mutations)
   ├─ MCP: postgres       (SELECT-only role, statement_timeout)
   └─ MCP: mongo          (find/aggregate only, read-only user)
   │
answer: root cause · evidence (query + result snippets) · confidence · suggested fix
```

**Milestones.**

1. **MVP (the guide's week-4 pitch):** the App Insights MCP server only, plus 3 symptom playbooks. Demo it to your lead.
2. Add Fluent + Postgres. Delegate log-searching to a subagent (module 11) to keep the main context clean.
3. **The eval suite:** 15–30 *replays of past incidents with known root causes*. Grade root-cause correctness (an LLM judge checked against the incident's documented cause) plus evidence quality.
4. Harness experiments on that suite (module 09): playbooks on/off, model/effort, subagent on/off.
5. Rollout: a Slack or Teams entry point, plus traces of every investigation.

**CV metrics to collect:** time-to-root-cause before vs. after, root-cause accuracy on the replay suite, cost per investigation.

**Rules (from your guide).**

- Read-only is enforced in the tool layer (DB roles, query-only APIs), **never only in the prompt**.
- Get your employer's sign-off before publishing anything. An anonymized write-up with metrics is enough.
- Run the module 12 threat model first, because order data is untrusted input.

---

## Capstone B: Snyk remediation harness (project 5)

**Folder:** [`snyk-harness/`](snyk-harness/) · **Time:** 2 weeks · **Uses:** 04, 06, 07, 09, 11

**Problem.** You fixed Snyk issues across 8 repos with Copilot CLI in autopilot. Rebuild that as a proper, open-source harness.

**Architecture.**

```
for each repo (parallel, with a concurrency limit):
  git worktree → sandbox container
  agent: "fix the Snyk issues, minimal changes"
  gates (hooks): build ✓ → tests ✓ → snyk test ✓ (no new issues)
     fail → feed the error back (≤3 retries) → still failing → mark "needs human"
  pass → commit on a branch + PR description
summary report: repo · issues fixed · gates · retries · cost
```

**Milestones:** a single repo working end to end → gates + retries → multiple repos in parallel → cost budget per repo (stop when exceeded) → a report as markdown/HTML → publish the repo with a demo GIF.

**Eval:** a set of public repos pinned to vulnerable dependency versions, with known fixes. Measure the fix rate, the regressions introduced (should be 0) and the cost per repo.

---

## In parallel: contribute to OpenCode

Find a `good first issue` in [OpenCode](https://github.com/anomalyco/opencode), which is TypeScript, a harness and widely used. Read its agent loop first (you'll recognize everything from 01–06). Merged PRs to a well-known harness are strong signals on a CV.
