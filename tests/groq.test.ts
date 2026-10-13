import assert from "node:assert/strict";
import test from "node:test";
import { chatWithGroq, type GroqMessage, type GroqTool } from "../src/groq.js";

test("sends tool results to Groq with their tool_call_id", async () => {
  const messages: GroqMessage[] = [
    { role: "user", content: "Kiểm tra thời gian" },
    { role: "assistant", content: null, tool_calls: [{
      id: "call_1",
      type: "function",
      function: { name: "check_minutes", arguments: '{"limit":20,"activities":[5,10,10]}' },
    }] },
    { role: "tool", tool_call_id: "call_1", content: '{"valid":false}' },
  ];
  const tools: GroqTool[] = [{
    type: "function",
    function: {
      name: "check_minutes",
      description: "Kiểm tra tổng phút",
      parameters: { type: "object", properties: {} },
    },
  }];
  let sentUrl = "";
  let sentInit: RequestInit | undefined;
  const fakeFetch = async (url: string, init: RequestInit) => {
    sentUrl = url;
    sentInit = init;
    return new Response(JSON.stringify({
      choices: [{ message: { role: "assistant", content: "Không hợp lệ." } }],
    }), { status: 200 });
  };

  const answer = await chatWithGroq(messages, tools, "test-key", fakeFetch);

  assert.equal(sentUrl, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal(new Headers(sentInit?.headers).get("Authorization"), "Bearer test-key");
  const body = JSON.parse(String(sentInit?.body));
  assert.equal(body.model, "openai/gpt-oss-20b");
  assert.equal(body.messages[2].tool_call_id, "call_1");
  assert.deepEqual(body.tools, tools);
  assert.equal(answer.content, "Không hợp lệ.");
});

test("reports Groq HTTP errors without exposing the API key", async () => {
  const fakeFetch = async () => new Response(JSON.stringify({ error: { message: "Invalid API key" } }), {
    status: 401,
  });

  await assert.rejects(
    chatWithGroq([{ role: "user", content: "Xin chào" }], [], "secret-key", fakeFetch),
    (error: unknown) => {
      assert.match(String(error), /Groq HTTP 401.*Invalid API key/);
      assert.doesNotMatch(String(error), /secret-key/);
      return true;
    },
  );
});
