import { stdin, stdout } from "process";
import { createInterface } from "readline/promises";
import { checkMinutes } from "./tools.js";
import { readFile } from "./read_file.js";
import { selectToolMessage } from "./select_tool_message.js";
import { chatWithGroq, type GroqMessage, type GroqTool } from "./groq.js";

const rl = createInterface({ input: stdin, output: stdout });
const checkMinutesTool: GroqTool = {
  type: "function",
  function: {
    name: "check_minutes",
    description: "Tính tổng phút và kiểm tra kế hoạch có vượt quá thời gian mỗi ngày không.",
    parameters: {
      type: "object",
      required: ["limit", "activities"],
      properties: {
        limit: { type: "number", description: "Số phút tối đa mỗi ngày" },
        activities: {
          type: "array",
          description: "Số phút của từng hoạt động",
          items: { type: "number" },
        },
      },
    },
  },
};

const readFileTool: GroqTool = {
  type: "function",
  function: {
    name: "read_file",
    description: "Đọc nội dung file trong thư mục src. filePath tính từ src, ví dụ tools.ts.",
    parameters: {
      type: "object",
      required: ["filePath"],
      properties: {
        filePath: { type: "string", description: "Đường dẫn tương đối từ src, ví dụ tools.ts" },
      },
    },
  },
};

try {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Thiếu GROQ_API_KEY. Hãy tạo file .env rồi chạy: node --env-file=.env --import=tsx src/agent.ts");
  }

  while (true) {
    const input = (await rl.question("Bạn: ")).trim();
    if (input === "/exit") break;
    if (!input) continue;

    const messages: GroqMessage[] = [
      { role: "system", content: "Trả lời bằng tiếng Việt. Khi cần kiểm tra tổng phút, hãy gọi check_minutes. Khi cần đọc file trong src, hãy gọi read_file với filePath tính từ src, ví dụ tools.ts. Khi đã có kết quả tool, dùng đúng số liệu và kết luận từ tool." },
      { role: "user", content: input },
    ];

    for (let step = 0; step < 3; step++) {
      const response = await chatWithGroq(messages, [checkMinutesTool, readFileTool], apiKey);

      const toolMessage = step === 0
        ? selectToolMessage(input, response)
        : response;
      if (toolMessage !== response) {
        console.log("Model chưa gọi read_file; chương trình đọc file bạn đã nêu.");
      }
      const calls = toolMessage.tool_calls ?? [];
      messages.push(toolMessage);

      if (calls.length === 0) {
        console.log("AI:", toolMessage.content || "Model không trả lời.");
        break;
      }

      for (const call of calls) {
        let args: Record<string, unknown>;
        try {
          const parsed: unknown = JSON.parse(call.function.arguments);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("Đối số phải là object JSON.");
          }
          args = parsed as Record<string, unknown>;
        } catch {
          const result = { ok: false, error: "Đối số tool không phải object JSON hợp lệ." };
          console.log("Kết quả tool:", result.error);
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
          continue;
        }

        if (call.function.name === "read_file") {
          const filePath = args.filePath;
          const result = typeof filePath === "string" && filePath.trim()
            ? await readFile(filePath)
            : { ok: false, error: "filePath phải là chuỗi không rỗng." };

          console.log("Kết quả read_file:", result.ok ? `Đã đọc ${filePath}` : result.error);
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
          continue;
        }

        if (call.function.name !== "check_minutes") {
          const result = { ok: false, error: `Tool không được hỗ trợ: ${call.function.name}` };
          console.log("Kết quả tool:", result.error);
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
          continue;
        }

        const { limit, activities } = args;

        if (
          typeof limit !== "number" ||
          !Number.isFinite(limit) ||
          limit < 0 ||
          !Array.isArray(activities) ||
          !activities.every((minutes: unknown) => typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 0)
        ) {
          const result = { ok: false, error: "limit hoặc activities không hợp lệ." };
          console.log("Kết quả tool:", result.error);
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
          continue;
        }

        const result = checkMinutes(limit, activities);
        const toolResult = {
          limit,
          totalMinutes: result.totalMinutes,
          valid: result.valid,
          overByMinutes: Math.max(0, result.totalMinutes - limit),
        };
        const verdict = toolResult.valid
          ? `Hợp lệ: dùng ${toolResult.totalMinutes}/${toolResult.limit} phút.`
          : `Không hợp lệ: dùng ${toolResult.totalMinutes}/${toolResult.limit} phút, vượt ${toolResult.overByMinutes} phút.`;

        console.log("Kết luận:", verdict);

        console.log("Kết quả từ code:", toolResult);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(toolResult),
        });
      }

      if (step === 2) {
        console.log("Đã đạt giới hạn 3 bước; chưa có câu trả lời cuối.");
      }
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  rl.close();
}
