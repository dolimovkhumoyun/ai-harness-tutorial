// Works out of the box. Run it to check your key and setup.
import { createClient } from "../../shared/client.js";
import { MODEL } from "../../shared/config.js";

const client = createClient(); // reads LLM_API_KEY / LLM_BASE_URL from .env

const response = await client.messages.create({
  model: MODEL,
  max_tokens: 1000,
  messages: [{ role: "user", content: "Say hello to a future AI harness engineer in one sentence." }],
});

for (const block of response.content) {
  if (block.type === "text") console.log(block.text);
}
console.log("\nstop_reason:", response.stop_reason);
console.log("usage:", response.usage);
