import ollama from "ollama";

const model = "qwen2.5:1.5b";
const intro = { role: "user", content: "Tên tôi là Tien." };
const question = { role: "user", content: "Tên tôi là gì?" };

const first = await ollama.chat({ model, messages: [intro] });

const withoutHistory = await ollama.chat({ model, messages: [question] });

const withHistory = await ollama.chat({
  model,
  messages: [intro, question],
  options: { temperature: 0 },
});

console.log("Phản hồi lượt đầu:", first.message.content);
console.log("Không có lịch sử:", withoutHistory.message.content);
console.log("Có lịch sử:", withHistory.message.content);
console.log("Token đầu vào:", withoutHistory.prompt_eval_count, "→", withHistory.prompt_eval_count);
