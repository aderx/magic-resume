import { normalizeApiEndpoint } from "@/config/ai";

type GeminiPart = {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
};

type GeminiContent = {
  role?: "user" | "model";
  parts: GeminiPart[];
};

type GeminiGenerationConfig = {
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
};

type GeminiRequestParams = {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  contents: GeminiContent[];
  systemInstruction?: string;
  generationConfig?: GeminiGenerationConfig;
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

export const createGeminiTextContent = (text: string): GeminiContent => ({
  role: "user",
  parts: [{ text }],
});

export const createGeminiInlineDataPart = (
  mimeType: string,
  data: string
): GeminiPart => ({
  inline_data: {
    mime_type: mimeType,
    data,
  },
});

export const requestGeminiContent = async ({
  apiKey,
  apiEndpoint,
  model,
  contents,
  systemInstruction,
  generationConfig,
}: GeminiRequestParams) => {
  const endpoint = normalizeApiEndpoint(apiEndpoint);
  if (!endpoint) {
    throw new Error("Gemini API endpoint is required");
  }
  const url = new URL(`${endpoint}/models/${model}:generateContent`);
  url.searchParams.set("key", apiKey.trim());

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      ...(systemInstruction?.trim()
        ? {
            systemInstruction: {
              parts: [{ text: systemInstruction.trim() }],
            },
          }
        : {}),
      ...(generationConfig ? { generationConfig } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(await getGeminiErrorMessage(response));
  }

  const data = await response.json();
  const text = extractGeminiText(data);

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
};

export const formatGeminiErrorMessage = (error: unknown) => {
  const anyError = error as any;
  const baseMessage =
    typeof anyError?.message === "string" && anyError.message
      ? anyError.message
      : "Gemini request failed";
  const details = anyError?.errorDetails;

  if (!details) return baseMessage;

  try {
    const detailText = Array.isArray(details)
      ? JSON.stringify(details)
      : String(details);
    return `${baseMessage} | details: ${detailText}`;
  } catch {
    return baseMessage;
  }
};
