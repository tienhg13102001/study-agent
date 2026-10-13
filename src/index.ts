type ChatResult = { message: { content: string } };

async function main(): Promise<void> {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5:1.5b",
      messages: [{ role: "user", content: "Giải thích AI agent bằng một câu." }],
      stream: false,
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  const data = (await response.json()) as ChatResult;
  console.log(data.message.content);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
