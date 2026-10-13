export type GroqToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type GroqAssistantMessage = {
  role: "assistant";
  content: string | null;
  tool_calls?: GroqToolCall[];
};

export type GroqMessage =
  | { role: "system" | "user"; content: string }
  | GroqAssistantMessage
  | { role: "tool"; tool_call_id: string; content: string };

export type GroqTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

export async function chatWithGroq(
  messages: GroqMessage[],
  tools: GroqTool[],
  apiKey: string,
  fetchImpl: (url: string, init: RequestInit) => Promise<Response> = fetch,
): Promise<GroqAssistantMessage> {
  const response = await fetchImpl(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, messages, tools, tool_choice: "auto", temperature: 0 }),
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json() as { error?: { message?: string } };
      detail = body.error?.message ?? detail;
    } catch {
      // Giữ status HTTP nếu máy chủ trả về nội dung không phải JSON.
    }
    throw new Error(`Groq HTTP ${response.status}: ${detail}`);
  }

  const body = await response.json() as { choices?: Array<{ message?: GroqAssistantMessage }> };
  const message = body.choices?.[0]?.message;
  if (message?.role !== "assistant") {
    throw new Error("Groq không trả về tin nhắn assistant.");
  }
  return message;
}
