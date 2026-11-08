# 06 · Hooks & verification

**Goal:** stop trusting the model's "Done! ✅". Deterministic checks decide when work is done, and failures go straight back into the loop. This is your Snyk loop ("no commit unless build and tests pass") built into the harness.
**Time:** 3–4 hours · **Prerequisites:** 05

**Start:** `cp -n 05-context-engineering/src/*.ts 06-hooks-verification/src/`. The new file is `hooks.ts`. The fixture to fix is `fixtures/buggy-orders/`.

## Read first

1. [Claude Code hooks](https://code.claude.com/docs/en/hooks). The lifecycle events (PreToolUse, PostToolUse, Stop) are the design to copy.
2. [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) (Anthropic). The generator/evaluator split.
3. [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/blog/harness-engineering) (OpenAI). Linters and tests as the agent's guardrails.

---

## The idea in plain words

Models are optimistic. They will say "all tests pass" without running them. A **hook** is plain code that runs at a fixed point in the loop, every time, whatever the model thinks:

```
   model → tool_use(edit_file) ──▶ PreToolUse hook   (block? rewrite?)
                                       │
                                  run the tool
                                       │
                                  PostToolUse hook  (typecheck the edited file)
                                       │  fails → append the error to the tool_result
                                       ▼
   model → end_turn ─────────────▶ Stop hook        (run the test suite)
                                       │  fails → DON'T stop: push "Tests fail: …, keep going"
                                       ▼  passes
                                     done
```

The design rule from your guide: **success is silent, failure is verbose.** A passing typecheck adds nothing to context (zero tokens). A failing one injects the exact compiler error, so the model fixes it on the next turn without asking.

Two guards you always need:

- **Retry budget.** A Stop hook that always fails means an infinite loop. Allow at most 3 "keep going" pushes, then stop and report `failed_verification`.
- **The model must not be able to disable the checks.** Hooks live in the harness, not in a file the agent can edit. (Agents have been seen deleting failing tests to make them "pass". Your Stop hook should also check that the test files are unchanged.)

---

## Task

1. **`hooks.ts`**: a tiny hook system:
   ```ts
   interface Hooks {
     preToolUse?(call): Promise<{ block?: string }>;
     postToolUse?(call, result): Promise<{ append?: string }>;
     onStop?(): Promise<{ continueWith?: string }>;
   }
   ```
   Wire all three into your loop.
2. **PostToolUse**: after `edit_file` on a `.js`/`.ts` file, run `node --check <file>` (or `tsc --noEmit`) in the sandbox. Append the errors only if it fails.
3. **Stop hook**: run `node --test` in the workspace. On failure, push the **tail** of the output (reuse `offload`) as a user message, up to 3 times.
4. **Test-tampering guard**: hash the `*.test.js` files at start; if a hash changes, the Stop hook fails with "test files must not be modified".
5. Run it on the fixture. Copy `fixtures/buggy-orders` into your sandbox workspace and give the agent the task *"Make all tests pass. Do not modify test files."*
6. Compare with hooks **off** vs **on**: success, turns, cost. Add the result to `03-tool-design/RATCHET.md`.

### Done when

- [ ] A syntax error from an edit is reported back automatically, without the model running anything
- [ ] The agent can't finish while tests fail (up to the retry budget)
- [ ] Modifying a test file is caught
- [ ] The fixture goes from 4 failing tests (3 bugs) to 0, with hooks on
- [ ] You have the on/off comparison numbers

<details><summary>Hint: hashing files</summary>

`crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex")`. Store a `Map<path, hash>` at run start.
</details>

## Stretch

- Add an **LLM-judge Stop hook**: a second, cheap model call that reviews the diff against the task ("Did it do what was asked? Any shortcuts?"). This is the evaluator in planner/generator/evaluator.
- Run `eslint` as a PostToolUse hook and measure whether lint feedback changes code quality.
- Make hooks configurable from a `hooks.json`, like Claude Code does.

## Self-check

1. Why inject *only failures* into context?
2. Why does a Stop hook need a retry budget?
3. Where does the "no commit unless tests pass" rule from your Snyk work belong: prompt, hook, or tool?

<details><summary>Answers</summary>

1. Passing output is noise that costs tokens and dilutes attention. Failures carry the information the model needs to act.
2. Some failures are beyond the model's reach (a flaky test, a missing dependency). Without a cap, the loop burns money forever.
3. A hook, or the commit tool itself refusing to run. It must be deterministic and impossible for the model to skip.
</details>
