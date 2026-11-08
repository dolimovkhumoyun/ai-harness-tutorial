# 04 · Sandboxing & permissions

**Goal:** let the agent run commands without being able to hurt your machine, and decide which actions need a human.
**Time:** 3–5 hours · **Prerequisites:** 03, Docker running

**Start:** `cp -n 03-tool-design/src/*.ts 04-sandbox-permissions/src/`. The new files are `sandbox.ts`, `permissions.ts` and `permissions.test.ts`.

## Read first

1. [Claude Code: sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing) (Anthropic engineering)
2. [Claude Code permissions docs](https://code.claude.com/docs/en/permissions). A real allow/ask/deny design you already use.
3. Simon Willison's [lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/). Why agents with tools are a security problem. Module 12 builds on it.

---

## The idea in plain words

There are two separate layers. Don't confuse them:

```
             model asks to run:  rm -rf / --no-preserve-root
                           │
   ┌───────────────────────▼────────────────────────┐
   │ 1. PERMISSION GATE  (policy: should this run?) │  allow / ask human / deny
   └───────────────────────┬────────────────────────┘
                           │ allowed
   ┌───────────────────────▼────────────────────────┐
   │ 2. SANDBOX  (containment: what CAN it touch?)  │  container, no network,
   └────────────────────────────────────────────────┘  only /workspace mounted
```

- The **sandbox** is the real security boundary. Assume the gate will miss something, because regexes can be bypassed (`r''m -rf`, `$(echo rm)`, base64, …). Even then, the damage stays inside a throwaway container with no network and only a scratch folder mounted.
- The **permission gate** is policy and UX. It blocks obvious disasters early, asks a human for risky but legitimate actions (`git push`, `npm publish`), and lets safe ones through without prompting. Too many prompts and people stop reading them ("approval fatigue"); too few and it's unsafe.

Rule evaluation order, the same one Claude Code uses: **deny beats ask, and ask beats allow.** Anything unmatched falls to a default (usually ask).

Your guide's rule for the flagship agent ties in here: **enforce read-only in the tool layer, not in the prompt.** A prompt that says "never write to the DB" is a wish. A DB user with only `SELECT` grants is a guarantee.

### Docker setup in one line

Use one long-lived container per run, and `docker exec` each command into it:

```bash
docker run -d --rm --name agent-<runId> --network none --memory 1g --cpus 1 \
  -v "$PWD/workspace:/workspace" -w /workspace node:22-slim sleep infinity
docker exec agent-<runId> sh -c "<command>"
docker rm -f agent-<runId>   # on exit, always (use try/finally)
```

---

## Task

1. **`sandbox.ts`**: `Sandbox.start()`, `exec(cmd, timeoutMs)` → `{ stdout, stderr, exitCode, timedOut }`, and `stop()`. Your `bash` tool now runs through it. Also limit `read_file` and `edit_file` to the workspace folder: reject paths that escape it (`../`, absolute paths, symlinks).
2. **`permissions.ts`**: `decide(command) → "allow" | "ask" | "deny"` with:
   - **deny**: `rm -rf /` or `~`, `git push --force`, `DROP TABLE`, `curl … | sh`, `mkfs`, fork bombs
   - **ask**: `git push`, `npm publish`, `rm -rf <anything>`, any network tool (`curl`, `wget`) when the network is enabled
   - **allow**: `ls`, `cat`, `rg`, `grep`, `node`, `npm test`, `npx tsc`, `git status/diff/log`
   - split compound commands (`&&`, `||`, `;`, `|`) and decide on the **strictest** part
3. Make **`permissions.test.ts`** pass: `npx tsx --test 04-sandbox-permissions/src/permissions.test.ts`. Then add 5 cases of your own, including one bypass attempt you *can't* catch. Write down why the sandbox still saves you.
4. Remove the y/N prompt from module 01. Prompt the human only when `decide()` says `ask`. Log every decision to the trace.

### Done when

- [ ] Commands run in a container with `--network none`; the container is removed on exit, even after a crash
- [ ] `read_file("../../etc/passwd")` is rejected
- [ ] All tests pass, plus your own 5
- [ ] The trace shows every permission decision
- [ ] A short note in this folder: "what my gate can't catch, and why that's OK"

<details><summary>Hint: splitting compound commands</summary>

A simple split on `/&&|\|\||;|\|/` is fine for learning. Real harnesses use a shell parser (for example `shell-quote`, or tree-sitter-bash). Note in your write-up that naive splitting breaks on quoted strings.
</details>

<details><summary>Hint: path confinement</summary>

```ts
const target = path.resolve(ROOT, p);
const rel = path.relative(ROOT, target);
if (rel.startsWith("..") || path.isAbsolute(rel)) reject();
// then fs.realpath(target) and check again, to catch symlinks
```
</details>

## Stretch

- Run the container with a read-only root filesystem (`--read-only --tmpfs /tmp`).
- Use `git worktree` for the workspace, so each run gets a clean copy of a repo. This is exactly what your Snyk harness (capstone) needs.
- Allow network access only to the npm registry, through a proxy allow-list.

## Self-check

1. Why is a regex deny-list *not* a security boundary?
2. Why decide on the strictest part of a compound command?
3. Where would the "read-only" guarantee live for a Postgres tool?

<details><summary>Answers</summary>

1. Shell syntax has endless ways to hide a command. Only containment (the sandbox) limits the damage.
2. `ls && rm -rf ~` is only as safe as its most dangerous part.
3. In the database: a role with only SELECT grants, plus `default_transaction_read_only = on`. Never only in the prompt.
</details>
