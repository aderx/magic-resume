import { AI_MODEL_CONFIGS, AIModelType } from "@/config/ai";
import {
  createGeminiTextContent,
  formatGeminiErrorMessage,
  requestGeminiContent,
} from "@/lib/server/gemini";

type TestAIConfigurationInput = {
  apiKey: string;
  model: string;
  modelType: AIModelType;
  apiEndpoint?: string;
};

const TEST_SYSTEM_PROMPT = "You are a connection test assistant. Reply with OK only.";
const TEST_USER_PROMPT = "Reply with OK only.";

const getProviderErrorMessage = async (response: Response) => {
  const fallbackMessage = `Request failed: ${response.status} ${response.statusText}`;
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (typeof data?.error === "string" && data.error.trim()) return data.error;
      if (typeof data?.message === "string" && data.message.trim()) return data.message;
      if (typeof data?.error?.message === "string" && data.error.message.trim()) {
        return data.error.message;
      }
    }

    const text = await response.text();
    return text.trim() || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

export const testAIConfiguration = async ({
  apiKey,
  model,
  modelType,
  apiEndpoint,
}: TestAIConfigurationInput) => {
  const modelConfig = AI_MODEL_CONFIGS[modelType];
  if (!modelConfig) {
    throw new Error("Invalid model type");
  }

  if (!apiKey?.trim()) {
    throw new Error("API key is required");
  }

  if (modelConfig.requiresModelId && !model?.trim()) {
    throw new Error("Model ID is required");
  }

  if (!apiEndpoint?.trim()) {
    throw new Error("API endpoint is required");
  }

  if (modelType === "gemini") {
    const text = await requestGeminiContent({
      apiKey: apiKey.trim(),
      apiEndpoint: apiEndpoint.trim(),
      model: model.trim(),
      contents: [createGeminiTextContent(TEST_USER_PROMPT)],
      systemInstruction: TEST_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0,
        topP: 1,
        maxOutputTokens: 32,
      },
    });

    if (!text) {
      throw new Error("Provider returned an empty response");
    }

    return { message: text };
  }

  const response = await fetch(modelConfig.url(apiEndpoint), {
    method: "POST",
    headers: modelConfig.headers(apiKey.trim()),
    body: JSON.stringify({
      model: modelConfig.requiresModelId ? model.trim() : modelConfig.defaultModel,
      messages: [
        {
          role: "system",
          content: TEST_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: TEST_USER_PROMPT,
        },
      ],
      temperature: 0,
      top_p: 1,
      max_tokens: 32,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(await getProviderErrorMessage(response));
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message?.content?.trim();

  if (!message) {
    throw new Error("Provider returned an empty response");
  }

  return { message };
};

export const formatAIConfigurationTestError = (error: unknown) =>
  formatGeminiErrorMessage(error);
