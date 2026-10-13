import assert from "node:assert/strict";
import test from "node:test";
import type { GroqAssistantMessage } from "../src/groq.js";
import { selectToolMessage } from "../src/select_tool_message.js";

test("requests read_file when the model skips an explicit file request", () => {
  const modelMessage: GroqAssistantMessage = { role: "assistant", content: "Tôi không đọc được file." };
  const result = selectToolMessage("đọc file tools.ts và giải thích các hàm trong đó", modelMessage);

  assert.equal(result.content, null);
  assert.deepEqual(result.tool_calls?.[0]?.function, {
    name: "read_file",
    arguments: '{"filePath":"tools.ts"}',
  });
  assert.equal(result.tool_calls?.[0]?.type, "function");
  assert.ok(result.tool_calls?.[0]?.id);
});

test("preserves a tool call already chosen by the model", () => {
  const modelMessage: GroqAssistantMessage = {
    role: "assistant",
    content: null,
    tool_calls: [{ id: "call_1", type: "function", function: { name: "check_minutes", arguments: '{"limit":20,"activities":[5,10]}' } }],
  };

  assert.equal(selectToolMessage("đọc file tools.ts", modelMessage), modelMessage);
});

test("does not force a tool for a question without a file request", () => {
  const modelMessage: GroqAssistantMessage = { role: "assistant", content: "Xin chào!" };

  assert.equal(selectToolMessage("Xin chào!", modelMessage), modelMessage);
});
