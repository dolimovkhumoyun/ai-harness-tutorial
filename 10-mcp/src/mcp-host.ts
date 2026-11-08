// TODO(10): make your harness an MCP host.
import fs from "node:fs";
import type Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

type ServerConfig = Record<string, { command: string; args: string[] }>;

export class McpHost {
  private clients = new Map<string, Client>();

  /** Connect to every server in mcp.json. */
  async connectAll(configPath = "10-mcp/mcp.json"): Promise<void> {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as ServerConfig;
    for (const [name, { command, args }] of Object.entries(config)) {
      const client = new Client({ name: "mini-harness", version: "0.1.0" });
      await client.connect(new StdioClientTransport({ command, args }));
      this.clients.set(name, client);
    }
  }

  /** All MCP tools as Anthropic tools, namespaced "<server>__<tool>". */
  async tools(): Promise<Anthropic.Tool[]> {
    // TODO: for each client: (await client.listTools()).tools → { name: `${server}__${t.name}`, description, input_schema: t.inputSchema }
    return [];
  }

  /** Route a namespaced call; never throws. */
  async call(namespacedName: string, input: unknown): Promise<{ content: string; isError: boolean }> {
    // TODO: split on "__", find the client, client.callTool({ name, arguments: input })
    //       join text blocks of result.content; carry result.isError
    void namespacedName; void input;
    return { content: "TODO: implement McpHost.call", isError: true };
  }

  async closeAll(): Promise<void> {
    for (const c of this.clients.values()) await c.close();
  }
}
