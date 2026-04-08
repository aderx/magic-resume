import {
  AI_MODEL_CONFIGS,
  AIModelType,
  DEFAULT_GRAMMAR_CONFIG,
  DEFAULT_POLISH_CONFIG,
  normalizeApiEndpoint,
} from "@/config/ai";

type DirectAIRequestBase = {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  modelType: AIModelType;
  signal?: AbortSignal;
};

type CompatibleMessage = {
  role: "system" | "user";
  content: string;
};

type DirectPolishRequest = DirectAIRequestBase & {
  content: string;
  customInstructions?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  systemPrompt?: string;
  onDelta?: (chunk: string) => void;
};

type DirectGrammarRequest = DirectAIRequestBase & {
  content: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  systemPrompt?: string;
};

type DirectGeminiRequest = DirectAIRequestBase & {
  content: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  responseMimeType?: string;
};

const TEST_SYSTEM_PROMPT = "You are a connection test assistant. Reply with OK only.";
const TEST_USER_PROMPT = "Reply with OK only.";
const DIRECT_REQUEST_FAILED_MESSAGE =
  "Unable to reach the AI service. Check the API endpoint, verify the local service is running, and make sure it allows browser CORS requests.";

const normalizeDirectClientError = (error: unknown) => {
  if (error instanceof DOMException && error.name === "AbortError") {
    throw error;
  }

  if (error instanceof Error) {
    if (
      error instanceof TypeError &&
      /failed to fetch|networkerror/i.test(error.message)
    ) {
      throw new Error(DIRECT_REQUEST_FAILED_MESSAGE);
    }

    throw error;
  }

  throw new Error("AI request failed");
};

const getCompatibleProviderError = async (response: Response) => {
  const fallbackMessage = `Request failed: ${response.status} ${response.statusText}`;
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await response.json();

      if (typeof data?.error === "string" && data.error.trim()) {
        return data.error;
      }

      if (typeof data?.message === "string" && data.message.trim()) {
        return data.message;
      }

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

const extractCompatibleText = (payload: any) => {
  const choice = payload?.choices?.[0];
  const content = choice?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  if (typeof choice?.text === "string") {
    return choice.text.trim();
  }

  return "";
};

const extractCompatibleDelta = (payload: any) => {
  const choice = payload?.choices?.[0];
  const deltaContent = choice?.delta?.content;

  if (typeof deltaContent === "string") {
    return deltaContent;
  }

  if (Array.isArray(deltaContent)) {
    return deltaContent
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("");
  }

  const messageContent = choice?.message?.content;

  if (typeof messageContent === "string") {
    return messageContent;
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("");
  }

  if (typeof choice?.text === "string") {
    return choice.text;
  }

  return "";
};

const extractGeminiText = (payload: any) => {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];

  return candidates
    .flatMap((candidate: any) =>
      Array.isArray(candidate?.content?.parts) ? candidate.content.parts : []
    )
    .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
};

const getGeminiErrorMessage = async (response: Response) => {
  const fallbackMessage = `Gemini request failed: ${response.status} ${response.statusText}`;

  try {
    const data = await response.json();

    if (typeof data?.error?.message === "string" && data.error.message.trim()) {
      return data.error.message;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

const readCompatibleStream = async (
  response: Response,
  onDelta?: (chunk: string) => void
) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    const text = extractCompatibleText(data);

    if (!text) {
      throw new Error("Provider returned an empty response");
    }

    onDelta?.(text);
    return text;
  }

  if (!contentType.includes("text/event-stream")) {
    const text = (await response.text()).trim();

    if (!text) {
      throw new Error("Provider returned an empty response");
    }

    onDelta?.(text);
    return text;
  }

  if (!response.body) {
    throw new Error("Provider returned an empty response");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      buffer += decoder.decode();
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;

      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;

      try {
        const payload = JSON.parse(data);
        const chunk = extractCompatibleDelta(payload);

        if (!chunk) continue;

        fullText += chunk;
        onDelta?.(chunk);
      } catch {
        continue;
      }
    }
  }

  const lastLine = buffer.trim();
  if (lastLine.startsWith("data:")) {
    const data = lastLine.slice(5).trim();

    if (data && data !== "[DONE]") {
      try {
        const payload = JSON.parse(data);
        const chunk = extractCompatibleDelta(payload);

        if (chunk) {
          fullText += chunk;
          onDelta?.(chunk);
        }
      } catch {
        // Ignore the trailing partial event.
      }
    }
  }

  if (!fullText.trim()) {
    throw new Error("Provider returned an empty response");
  }

  return fullText;
};

const requestCompatibleText = async ({
  apiKey,
  apiEndpoint,
  model,
  modelType,
  messages,
  signal,
  temperature,
  topP,
  maxTokens,
  stream = false,
  onDelta,
}: DirectAIRequestBase & {
  messages: CompatibleMessage[];
  temperature: number;
  topP: number;
  maxTokens: number;
  stream?: boolean;
  onDelta?: (chunk: string) => void;
}) => {
  const modelConfig = AI_MODEL_CONFIGS[modelType];
  const resolvedEndpoint = normalizeApiEndpoint(apiEndpoint);

  if (!resolvedEndpoint) {
    throw new Error("API endpoint is required");
  }

  const response = await fetch(modelConfig.url(resolvedEndpoint), {
    method: "POST",
    headers: modelConfig.headers(apiKey.trim()),
    body: JSON.stringify({
      model: modelConfig.requiresModelId ? model.trim() : modelConfig.defaultModel,
      messages,
      temperature,
      top_p: topP,
      max_tokens: maxTokens,
      stream,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(await getCompatibleProviderError(response));
  }

  if (stream) {
    return readCompatibleStream(response, onDelta);
  }

  const data = await response.json();
  const text = extractCompatibleText(data);

  if (!text) {
    throw new Error("Provider returned an empty response");
  }

  return text;
};

const requestGeminiText = async ({
  apiKey,
  apiEndpoint,
  model,
  content,
  signal,
  temperature,
  topP,
  maxTokens,
  systemPrompt,
  responseMimeType,
}: DirectGeminiRequest) => {
  const endpoint = normalizeApiEndpoint(apiEndpoint);

  if (!endpoint) {
    throw new Error("API endpoint is required");
  }

  const url = new URL(`${endpoint}/models/${model.trim()}:generateContent`);
  url.searchParams.set("key", apiKey.trim());

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: content }],
        },
      ],
      ...(systemPrompt.trim()
        ? {
            systemInstruction: {
              parts: [{ text: systemPrompt.trim() }],
            },
          }
        : {}),
      generationConfig: {
        temperature,
        topP,
        maxOutputTokens: maxTokens,
        ...(responseMimeType ? { responseMimeType } : {}),
      },
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(await getGeminiErrorMessage(response));
  }

  const data = await response.json();
  const text = extractGeminiText(data);

  if (!text) {
    throw new Error("Provider returned an empty response");
  }

  return text;
};

export const testAIConfigurationDirect = async ({
  apiKey,
  apiEndpoint,
  model,
  modelType,
  signal,
}: DirectAIRequestBase) => {
  try {
    if (!apiKey.trim()) {
      throw new Error("API key is required");
    }

    if (!model.trim()) {
      throw new Error("Model ID is required");
    }

    if (!normalizeApiEndpoint(apiEndpoint)) {
      throw new Error("API endpoint is required");
    }

    const message =
      modelType === "gemini"
        ? await requestGeminiText({
            apiKey,
            apiEndpoint,
            model,
            modelType,
            signal,
            content: TEST_USER_PROMPT,
            systemPrompt: TEST_SYSTEM_PROMPT,
            temperature: 0,
            topP: 1,
            maxTokens: 32,
          })
        : await requestCompatibleText({
            apiKey,
            apiEndpoint,
            model,
            modelType,
            signal,
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
            topP: 1,
            maxTokens: 32,
          });

    return { message };
  } catch (error) {
    normalizeDirectClientError(error);
  }
};

export const polishContentDirect = async ({
  apiKey,
  apiEndpoint,
  model,
  modelType,
  signal,
  content,
  customInstructions,
  temperature,
  topP,
  maxTokens,
  systemPrompt,
  onDelta,
}: DirectPolishRequest) => {
  try {
    let resolvedSystemPrompt =
      systemPrompt?.trim() || DEFAULT_POLISH_CONFIG.systemPrompt;

    if (customInstructions?.trim()) {
      resolvedSystemPrompt += `\n\n用户额外要求：\n${customInstructions.trim()}`;
    }

    if (modelType === "gemini") {
      const text = await requestGeminiText({
        apiKey,
        apiEndpoint,
        model,
        modelType,
        signal,
        content,
        systemPrompt: resolvedSystemPrompt,
        temperature:
          typeof temperature === "number"
            ? temperature
            : DEFAULT_POLISH_CONFIG.temperature,
        topP: typeof topP === "number" ? topP : DEFAULT_POLISH_CONFIG.topP,
        maxTokens:
          typeof maxTokens === "number"
            ? maxTokens
            : DEFAULT_POLISH_CONFIG.maxTokens,
      });

      onDelta?.(text);
      return text;
    }

    return requestCompatibleText({
      apiKey,
      apiEndpoint,
      model,
      modelType,
      signal,
      messages: [
        {
          role: "system",
          content: resolvedSystemPrompt,
        },
        {
          role: "user",
          content,
        },
      ],
      temperature:
        typeof temperature === "number"
          ? temperature
          : DEFAULT_POLISH_CONFIG.temperature,
      topP: typeof topP === "number" ? topP : DEFAULT_POLISH_CONFIG.topP,
      maxTokens:
        typeof maxTokens === "number"
          ? maxTokens
          : DEFAULT_POLISH_CONFIG.maxTokens,
      stream: true,
      onDelta,
    });
  } catch (error) {
    normalizeDirectClientError(error);
  }
};

export const checkGrammarDirect = async ({
  apiKey,
  apiEndpoint,
  model,
  modelType,
  signal,
  content,
  temperature,
  topP,
  maxTokens,
  systemPrompt,
}: DirectGrammarRequest) => {
  try {
    const resolvedSystemPrompt =
      systemPrompt?.trim() || DEFAULT_GRAMMAR_CONFIG.systemPrompt;

    if (modelType === "gemini") {
      return await requestGeminiText({
        apiKey,
        apiEndpoint,
        model,
        modelType,
        signal,
        content,
        systemPrompt: resolvedSystemPrompt,
        temperature:
          typeof temperature === "number"
            ? temperature
            : DEFAULT_GRAMMAR_CONFIG.temperature,
        topP: typeof topP === "number" ? topP : DEFAULT_GRAMMAR_CONFIG.topP,
        maxTokens:
          typeof maxTokens === "number"
            ? maxTokens
            : DEFAULT_GRAMMAR_CONFIG.maxTokens,
        responseMimeType: "application/json",
      });
    }

    return await requestCompatibleText({
      apiKey,
      apiEndpoint,
      model,
      modelType,
      signal,
      messages: [
        {
          role: "system",
          content: resolvedSystemPrompt,
        },
        {
          role: "user",
          content,
        },
      ],
      temperature:
        typeof temperature === "number"
          ? temperature
          : DEFAULT_GRAMMAR_CONFIG.temperature,
      topP: typeof topP === "number" ? topP : DEFAULT_GRAMMAR_CONFIG.topP,
      maxTokens:
        typeof maxTokens === "number"
          ? maxTokens
          : DEFAULT_GRAMMAR_CONFIG.maxTokens,
    });
  } catch (error) {
    normalizeDirectClientError(error);
  }
};
