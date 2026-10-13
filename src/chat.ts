import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import ollama, { type Message } from "ollama";

const rl = createInterface({ input: stdin, output: stdout });
const messages: Message[] = [
  {
    role: "system",
    content:
      "Bạn là trợ lý hỗ trợ học tiếng Anh. Trả lời bằng tiếng Việt, ngắn gọn và không lặp ý. Khi tư vấn cá nhân mà thiếu trình độ, mục tiêu hoặc thời gian học, hãy hỏi để làm rõ trước khi lập kế hoạch. Khi đã có đủ thông tin, đưa đúng số hoạt động được yêu cầu và gắn từng hoạt động với thời gian, mục tiêu của người học. Khi sửa câu, viết câu đúng bằng tiếng Anh, rồi chỉ giải thích lỗi thực sự có trong câu gốc. Khi đánh giá tiến bộ, phân biệt “Biết chắc” và “Chưa thể kết luận”. Không bảo đảm một trình độ từ thời gian học hoặc một bài tự luyện. Ví dụ — Hỏi: “Sửa: She don't like tea.” Đáp: “Câu đúng: She doesn't like tea. Giải thích: Chủ ngữ ‘she’ dùng ‘doesn't’ trong hiện tại đơn.”",
  },
];

try {
  while (true) {
    const input = (await rl.question("Bạn: ")).trim();
    if (input === "/exit") break;
    if (input === "/reset") {
      messages.length = 1;
      console.log("Đã xóa lịch sử.");
      continue;
    }
    if (!input) continue;

    messages.push({ role: "user", content: input });

    const stream = await ollama.chat({
      model: "qwen2.5:1.5b",
      messages,
      stream: true,
      options: { temperature: 0, num_predict: 120 },
    });

    let answer = "";
    stdout.write("AI: ");

    for await (const chunk of stream) {
      answer += chunk.message.content;
      stdout.write(chunk.message.content);

      if (chunk.done) {
        console.log(`\nToken: ${chunk.prompt_eval_count} vào, ${chunk.eval_count} ra; dừng: ${chunk.done_reason}; phí API: 0đ (Ollama local)`);
      }
    }

    messages.push({ role: "assistant", content: answer });
  }
} finally {
  rl.close();
}
