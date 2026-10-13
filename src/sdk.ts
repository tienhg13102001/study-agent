import ollama from "ollama";

async function main(): Promise<void> {
  // const result = await ollama.chat({
  //   model: "qwen2.5:1.5b",
  //   messages: [
  //     {
  //       role: "user",
  //       content: "Định nghĩa AI agent chính xác bằng một câu, không nhân hóa.",
  //     },
  //   ],
  //   options: {
  //     temperature: 0,
  //   },
  // });
  // console.log(result.message.content);
  // console.log("Token đầu vào:", result.prompt_eval_count);
  // console.log("Token đầu ra:", result.eval_count);
  // console.log("Thời gian (giây):", (result.total_duration / 1e9).toFixed(2));
  const stream = await ollama.chat({
    model: "qwen2.5:1.5b",
    messages: [
      {
        role: "system",
        content:
          "Trong bài này, AI agent là phần mềm nhận mục tiêu, chọn hành động, có thể gọi công cụ và quan sát kết quả. Trả lời bằng tiếng Việt, tối đa 2 câu, không thêm danh sách.",
      },
      { role: "user", content: "AI agent là gì?" },
    ],
    options: { temperature: 0, num_predict: 120 },
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.message.content);
    if (chunk.done) {
      console.log(`\nToken đầu vào: ${chunk.prompt_eval_count}`);
      console.log(`Token đầu ra: ${chunk.eval_count}`);
      console.log(`Lý do dừng: ${chunk.done_reason}`);
    }
  }
}

main().catch(console.error);
