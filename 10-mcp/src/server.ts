// An `orders` MCP server over stdio. READ-ONLY by design: there are no write tools.
// Run via a host (don't start it by hand), e.g. the Inspector:
//   npx @modelcontextprotocol/inspector npx tsx 10-mcp/src/server.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

interface Order { orderId: string; status: string; createdAt: string; customer: string; totalCents: number; location: string }
interface OrderEvent { ts: string; type: string; detail: string }

const here = path.dirname(fileURLToPath(import.meta.url));
const db = JSON.parse(fs.readFileSync(path.join(here, "../data/orders.json"), "utf8")) as {
  orders: Order[];
  events: Record<string, OrderEvent[]>;
};

const server = new McpServer({ name: "orders", version: "0.1.0" });

// ── Example tool (done) ────────────────────────────────────────────────
server.registerTool(
  "get_order",
  {
    description:
      "Get one order's current status, location and totals by its id (format ORD-1234). " +
      "Use this first when asked about a specific order; use get_order_events for its history.",
    inputSchema: z.object({ orderId: z.string().describe("Order id, e.g. ORD-1003") }),
  },
  async ({ orderId }) => {
    const order = db.orders.find((o) => o.orderId === orderId);
    if (!order) {
      return {
        isError: true,
        content: [{ type: "text", text: `No order ${orderId}. Use search_orders to find valid ids.` }],
      };
    }
    return { content: [{ type: "text", text: JSON.stringify(order, null, 2) }] };
  },
);

// ── TODO(10): search_orders({ status?, since? }), max 20, newest first ──

// ── TODO(10): get_order_events({ orderId }), the event timeline ────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("orders MCP server running on stdio"); // stderr only: stdout is the protocol
