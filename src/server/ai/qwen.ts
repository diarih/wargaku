import { env } from "~/env";

type QwenChatOptions = {
  system: string;
  user: string;
  temperature?: number;
};

type QwenChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const DEFAULT_QWEN_BASE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DEFAULT_QWEN_MODEL = "qwen-plus";

export function isQwenConfigured() {
  return Boolean(env.QWEN_API_KEY);
}

export async function chatWithQwen({
  system,
  user,
  temperature = 0.1,
}: QwenChatOptions) {
  if (!env.QWEN_API_KEY) {
    throw new Error("Qwen API is not configured.");
  }

  const response = await fetch(
    `${env.QWEN_BASE_URL ?? DEFAULT_QWEN_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.QWEN_MODEL ?? DEFAULT_QWEN_MODEL,
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    },
  );

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new Error(
      `Qwen request failed with status ${response.status}${payload ? `: ${payload}` : ""}`,
    );
  }

  const payload = (await response.json()) as QwenChatResponse;
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Qwen returned an empty response.");
  }

  return content;
}
