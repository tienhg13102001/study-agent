import type { GroqAssistantMessage } from "./groq.js";

const READ_REQUEST = /(?:đọc|xem|giải thích|phân tích)\s/i;
const QUOTED_FILE = /(['"`])([^'"`]+?\.(?:tsx?|jsx?|json|md|txt))\1/i;
const BARE_FILE = /(?:^|\s)([^\s'"`]+?\.(?:tsx?|jsx?|json|md|txt))(?=$|[\s.,;:!?)])/i;

export function selectToolMessage(input: string, modelMessage: GroqAssistantMessage): GroqAssistantMessage {
  if (modelMessage.tool_calls?.length || !READ_REQUEST.test(input)) return modelMessage;

  const filePath = input.match(QUOTED_FILE)?.[2] ?? input.match(BARE_FILE)?.[1];
  if (!filePath) return modelMessage;

  return {
    role: "assistant",
    content: null,
    tool_calls: [{
      id: "fallback_read_file",
      type: "function",
      function: { name: "read_file", arguments: JSON.stringify({ filePath }) },
    }],
  };
}
