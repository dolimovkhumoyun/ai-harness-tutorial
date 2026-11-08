# Glossary

Short definitions, with the module where each term is taught.

| Term | Plain meaning | Module |
|---|---|---|
| **Harness** | Everything around the model that makes it an agent: loop, tools, context, hooks, sandbox, evals. "Agent = Model + Harness." | 01 |
| **Token** | The unit the model reads and writes. About 4 English characters. You pay per token. | 00 |
| **Context window** | The maximum number of tokens a model can see at once (1M on current Claude models). | 00, 05 |
| **System prompt** | Standing instructions sent on every call. | 00 |
| **stop_reason** | Why the model stopped: `end_turn`, `tool_use`, `max_tokens`, `refusal`, `pause_turn`, `model_context_window_exceeded`. | 00 |
| **Effort** | `output_config.effort`: how hard the model thinks (low → max). Trades quality against cost. | 00, 09 |
| **Tool / tool_use / tool_result** | A function you describe; the model's request to call it; your reply with the output. | 01 |
| **Agent loop** | Call model → run requested tools → send results → repeat until done. | 01 |
| **Parallel tool use** | Several tool calls in one turn. All the results go back in one message. | 01 |
| **Trace** | A step-by-step record of a run (JSONL). | 02 |
| **ACI** | Agent-Computer Interface: tools designed for models the way UIs are designed for people. | 03 |
| **Strict tool use** | `strict: true`: tool inputs are guaranteed to match the schema. | 03 |
| **Ratchet** | Every agent mistake becomes a permanent fix (tool, error message, hook, rule). | 03 |
| **Sandbox** | An isolated environment (container, no network) that limits what commands can damage. | 04 |
| **Permission gate** | Policy deciding allow / ask / deny for each action. Deny beats ask, ask beats allow. | 04 |
| **Context rot** | Accuracy drops as context fills with irrelevant tokens. | 05 |
| **Offloading** | Keeping only the head and tail of a big output in context; the full text goes to a file. | 05 |
| **Compaction** | Summarizing the conversation and restarting from the summary when context gets large. | 05 |
| **Append-only history** | Never edit earlier messages. This keeps thinking blocks valid and the prompt cache warm. | 05 |
| **Prompt caching** | The API reuses an unchanged prefix (tools → system → messages) at a fraction of the price. | 05 |
| **AGENTS.md** | A project instruction file loaded into the system prompt. | 05 |
| **Hook** | Deterministic code run at a lifecycle point (pre-tool, post-tool, stop). | 06 |
| **"Success silent, failure verbose"** | Only failing checks inject output into context. | 06 |
| **Eval** | An automated task suite that measures agent quality. | 07 |
| **Grader** | Decides pass/fail: code-based, LLM judge or human. | 07 |
| **pass@k / pass^k** | At least one of k attempts passes / all k attempts pass. | 07 |
| **Oracle** | A reference solution run through the eval to prove each task is solvable. | 07, 08 |
| **Harbor** | A framework for running containerized agent benchmarks (Terminal-Bench, SWE-Bench, your own tasks). | 08 |
| **Ablation / one-variable experiment** | Change one harness setting, keep everything else fixed, measure. | 09 |
| **MCP** | Model Context Protocol: a standard plug between agents (hosts) and tool servers. | 10 |
| **Tool poisoning** | Malicious instructions hidden in an MCP tool's description. | 10, 12 |
| **Subagent** | A child agent with a fresh context, used for isolation. | 11 |
| **Workflow vs. agent** | Steps fixed in code vs. steps chosen by the model. | 11 |
| **Prompt injection** | Instructions hidden in data the agent reads. | 12 |
| **Lethal trifecta** | Private data + untrusted content + a way out = an exfiltration risk. | 12 |
| **Canary token** | A fake secret whose appearance anywhere proves a leak. | 12 |
