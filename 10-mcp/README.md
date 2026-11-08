# 10 · MCP: Model Context Protocol

**Goal:** build an MCP server, and make your harness an MCP **host**, so any MCP server's tools plug into your agent. This is direct preparation for the flagship's App Insights, Fluent and Postgres MCP servers.
**Time:** 4–6 hours · **Prerequisites:** 03 (tool design) at least

## Read first

1. [MCP introduction](https://modelcontextprotocol.io/docs/getting-started/intro) and *Architecture overview*
2. [MCP TypeScript SDK docs](https://ts.sdk.modelcontextprotocol.io/). Read *Build your first server* and *Build your first client*. This lab uses SDK v2 (`@modelcontextprotocol/server` and `@modelcontextprotocol/client`).
3. [MCP security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)

---

## The idea in plain words

Without MCP, every harness re-implements "a Postgres tool", "a GitHub tool", and so on. **MCP is a standard plug** between agents and tools, the way LSP is a standard between editors and languages:

```
 ┌───────────── HOST (your harness) ─────────────┐
 │  agent loop ─▶ MCP client ─┐                  │
 │               MCP client ─┐│                  │
 └───────────────────────────┼┼──────────────────┘
                 stdio / HTTP ││
        ┌────────────────────┘└───────────────┐
  MCP server: orders (yours)     MCP server: GitHub, App Insights, …
   tools: get_order, ...          tools: ...
```

- A **server** exposes **tools** (functions), **resources** (readable data such as files or docs) and **prompts** (templates).
- A **client** connects to a server and handles `listTools` / `callTool`.
- A **transport** carries the messages: **stdio** (a local child process; the client spawns it) or **Streamable HTTP** (remote).

Inside your harness, MCP is a translation layer:

```
listTools()  → each MCP tool { name, description, inputSchema } → Anthropic.Tool { name, description, input_schema }
tool_use     → client.callTool({ name, arguments }) → result.content → tool_result
```

### Two traps

- **stdout belongs to the protocol.** In a stdio server, `console.log` corrupts the JSON-RPC stream. Log with `console.error`.
- **Server tool descriptions are untrusted input.** They go straight into your model's context, so a malicious server can hide instructions there ("tool poisoning"). Namespace tool names (`orders__get_order`), show users which servers are connected, and review third-party servers the way you'd review a dependency.

### Read-only, enforced by the server

Your guide's flagship rule applies here: **the MCP server is where read-only is enforced.** The `orders` server below has no write tools at all, and its data access opens the data read-only.

---

## Task

### Part A: an `orders` MCP server (`src/server.ts`)

Mock data is in `data/orders.json` (orders + event history, shaped like a tiny Fluent Commerce).

1. `get_order({ orderId })` is done as the example. Read it.
2. Add `search_orders({ status?, since? })`: at most 20 results, newest first.
3. Add `get_order_events({ orderId })`: the event timeline, for answering "why is this order stuck?"
4. Return errors as `isError: true` results with helpful text (module 03 rules apply).
5. Test it with the MCP Inspector: `npx @modelcontextprotocol/inspector npx tsx 10-mcp/src/server.ts`

### Part B: your harness as a host (`src/mcp-host.ts`)

1. Connect to any number of servers listed in a `mcp.json` (`{ "orders": { "command": "npx", "args": ["tsx", "10-mcp/src/server.ts"] } }`).
2. Convert their tools to `Anthropic.Tool[]` with namespaced names (`orders__get_order`), and merge them with your built-in tools.
3. Route `tool_use` calls for `<server>__<tool>` to the right client, and turn `result.content` text blocks into `tool_result` content.
4. Ask your agent: *"Order ORD-1003 hasn't shipped. What happened?"*

### Part C: also plug it into Claude Code

`claude mcp add orders -- npx tsx /full/path/10-mcp/src/server.ts`, then ask Claude Code the same question. Compare its tool calls with your harness's.

### Done when

- [ ] The Inspector lists 3 tools and calls each one successfully
- [ ] Your harness answers the ORD-1003 question by using MCP tools
- [ ] Tool names are namespaced; an unknown server or tool gives a clean error result
- [ ] The server has no write paths; you can explain how you'd enforce that against a real Postgres

<details><summary>Hint: zod schema → what the model sees</summary>

The SDK turns your zod `inputSchema` into JSON Schema for `listTools`. On the host side, `tool.inputSchema` from `listTools()` can go into `input_schema` almost unchanged. It includes a `"$schema"` key, so drop it (`const { $schema, ...schema } = t.inputSchema`) to keep the request clean and stable for caching.
</details>

## Stretch

- Add a **resource**: `orders://playbooks/stuck-order` with a markdown runbook. That's the guide's "symptom playbooks".
- Serve the same server over Streamable HTTP.
- Write a test with `InMemoryTransport.createLinkedPair()` (no child process).

## Self-check

1. Why must a stdio MCP server never `console.log`?
2. Why namespace tool names in the host?
3. Where should "read-only" be enforced for the real Postgres MCP server?

<details><summary>Answers</summary>

1. stdout carries the JSON-RPC messages, so anything else written there breaks the protocol.
2. Two servers can both have a `search` tool. Namespacing avoids collisions and tells the model which system it's querying.
3. In the database role (SELECT-only grants, a read-only transaction), with the server exposing no write tools on top of that. Never in the prompt alone.
</details>
