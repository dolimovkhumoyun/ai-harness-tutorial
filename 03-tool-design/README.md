# 03 · Tool design

**Goal:** design tools the model uses *correctly*. Tool names, descriptions and error messages are prompts. They land in every request.
**Time:** 3–4 hours · **Prerequisites:** 02

**Start:** `rm 03-tool-design/src/tools.ts && cp -n 02-tracing/src/*.ts 03-tool-design/src/`. The `tools.ts` here is only a placeholder that lets the folder typecheck. The new files are `edit.ts` and `search.ts`. Add `EDIT_TOOL`/`SEARCH_TOOL` to your `TOOLS` and route them in `executeTool`.

## Read first

1. [Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) (Anthropic). The core reading for this module.
2. [SWE-agent: Agent-Computer Interfaces](https://arxiv.org/abs/2405.15793), sections 1–3. It introduced the term "ACI": tools designed for models the way UIs are designed for humans.
3. [Skill issue: harness engineering for coding agents](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents) (HumanLayer)

---

## The idea in plain words

You'd never give a junior developer an API with vague names and errors like `Error: 1`. The model is that developer, except it reads your docs on **every** call and can't ask you questions.

**Five principles of good tools:**

1. **Few tools that each do one clear job.** Ten overlapping tools confuse the model. `read_file`, `edit_file`, `search`, `bash` covers most coding work.
2. **The description says *when* to use it, not just *what* it does.** For example: "Use `search` to find where a symbol is defined *before* reading whole files."
3. **Inputs that are hard to get wrong.** Use an enum instead of a free string, and absolute paths instead of relative ones. Set `strict: true` (with `additionalProperties: false`) so inputs always match the schema.
4. **Errors that teach.** Not `"failed"`, but `"old_string appears 3 times in src/a.ts (lines 12, 40, 88). Include more surrounding lines so it is unique."` A good error message is the cheapest harness fix there is.
5. **Output sized for a context window.** Return the 20 most relevant matches plus "…312 more, narrow your query". Never return 50,000 lines.

### Why `edit_file` uses search/replace, not line numbers

Line numbers shift after every edit, and models miscount. The pattern used by Claude Code and most harnesses is **exact string replacement**: the model supplies `old_string` (which must occur **exactly once**) and `new_string`. If it occurs zero times or more than once, return a helpful error. This one design choice prevents a whole class of corrupted-file bugs.

### The ratchet starts here

Every time your agent misuses a tool, ask: **can I change the tool so this mistake becomes impossible, or at least obvious?** Fix the tool or its error message first. Change the prompt only when the tool can't help. Write each fix down in `RATCHET.md`; this log becomes interview material.

---

## Task

1. **`edit_file({ path, old_string, new_string })`** in `edit.ts`:
   - 0 matches → an error that shows the closest match (or the first lines of the file)
   - more than 1 match → an error listing the line numbers
   - exactly 1 → replace, then return a ~5-line snippet around the change
   - `old_string: ""` on a missing file → create the file
2. **`search({ pattern, path?, glob? })`** in `search.ts`: run `rg` (ripgrep), falling back to `grep -rn`. Return at most N matches, as `file:line: text`, plus a "…more" count.
3. **Rewrite all four descriptions** using the principles above. Add `strict: true`.
4. **Measure it.** Run the same 3 tasks before and after the description rewrite. Count tool errors and turns from your traces. Keep the numbers; they are your first tiny experiment.
5. Start `RATCHET.md` in this folder: *mistake I saw → what I changed → did it stop?*

Example tasks for step 4:

- "Rename the function `costUsd` to `calculateCost` everywhere in 00-setup-first-call."
- "Add a `--json` flag to 00's ask.ts that prints usage as JSON."
- "Find every place that reads `process.argv` and list them."

### Done when

- [ ] Ambiguous edits are rejected with line numbers; the model then succeeds on its retry
- [ ] Search output is capped and says how much was cut
- [ ] All tools have `strict: true` and "when to use" descriptions
- [ ] A before/after table (tool errors, turns, cost) for the 3 tasks
- [ ] `RATCHET.md` has at least 2 entries

<details><summary>Hint: counting occurrences with line numbers</summary>

Split the file on `old_string`: `parts.length - 1` is the match count. For line numbers, walk `indexOf` in a loop and count the `\n` characters before each index.
</details>

<details><summary>Hint: strict mode schema</summary>

```ts
{ name: "edit_file", strict: true, description: "...",
  input_schema: { type: "object", additionalProperties: false,
    properties: { path: {...}, old_string: {...}, new_string: {...} },
    required: ["path", "old_string", "new_string"] } }
```
</details>

## Stretch

- Add a `view_range` option to `read_file` (`offset`/`limit`) and return line-numbered output, as `cat -n` does.
- Compare your tools with Anthropic's built-in `text_editor_20250728` tool. What did they decide differently, and why?
- Read OpenCode's `edit` tool. How does it handle whitespace mismatches?

## Self-check

1. Why do you cap search output instead of returning everything?
2. A model keeps calling `bash cat file.ts` instead of `read_file`. Name two harness fixes.

<details><summary>Answers</summary>

1. Context space is limited and costs money. A huge result pushes out important context and hurts accuracy ("context rot").
2. Improve `read_file`'s description ("prefer this over `cat`"), or detect `cat` in `bash` and return a nudge such as "Use read_file for files; it supports ranges."
</details>
