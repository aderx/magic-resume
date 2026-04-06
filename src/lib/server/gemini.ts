import { GoogleGenerativeAI } from "@google/generative-ai";

export const ensureGeminiProxyDispatcher = () => {
  // Intentionally left as a no-op.
  // Importing `undici` here breaks the current webpack/edge build because it
  // pulls in `node:` scheme modules such as `node:diagnostics_channel`.
};

export const getGeminiModelInstance = (params: {
  apiKey: string;
  model: string;
  systemInstruction?: string;
  generationConfig?: Record<string, unknown>;
}) => {
  ensureGeminiProxyDispatcher();
  const genAI = new GoogleGenerativeAI(params.apiKey);

  return genAI.getGenerativeModel({
    model: params.model,
    systemInstruction: params.systemInstruction,
    generationConfig: params.generationConfig,
  });
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
  } catch (stringifyError) {
    return baseMessage;
  }
};
