import { createFileRoute } from "@tanstack/react-router";
import {
  AIModelType,
  AI_MODEL_CONFIGS,
  DEFAULT_GRAMMAR_CONFIG,
} from "@/config/ai";
import {
  createGeminiTextContent,
  formatGeminiErrorMessage,
  requestGeminiContent,
} from "@/lib/server/gemini";

export const Route = createFileRoute("/api/grammar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { apiKey, model, content, modelType, apiEndpoint, temperature, topP, maxTokens, systemPrompt } = body as {
            apiKey: string;
            model: string;
            content: string;
            modelType: AIModelType;
            apiEndpoint?: string;
            temperature?: number;
            topP?: number;
            maxTokens?: number;
            systemPrompt?: string;
          };

          const modelConfig = AI_MODEL_CONFIGS[modelType as AIModelType];
          if (!modelConfig) {
            throw new Error("Invalid model type");
          }

          const resolvedSystemPrompt = systemPrompt?.trim() || DEFAULT_GRAMMAR_CONFIG.systemPrompt;
          const resolvedTemperature = typeof temperature === "number" ? temperature : DEFAULT_GRAMMAR_CONFIG.temperature;
          const resolvedTopP = typeof topP === "number" ? topP : DEFAULT_GRAMMAR_CONFIG.topP;
          const resolvedMaxTokens = typeof maxTokens === "number" ? maxTokens : DEFAULT_GRAMMAR_CONFIG.maxTokens;

          if (modelType === "gemini") {
            const geminiModel = model || "gemini-flash-latest";
            const text = await requestGeminiContent({
              apiKey,
              apiEndpoint: apiEndpoint || "",
              model: geminiModel,
              contents: [createGeminiTextContent(content)],
              systemInstruction: resolvedSystemPrompt,
              generationConfig: {
                temperature: resolvedTemperature,
                topP: resolvedTopP,
                maxOutputTokens: resolvedMaxTokens,
                responseMimeType: "application/json",
              },
            });

            return Response.json({
              choices: [
                {
                  message: {
                    content: text,
                  },
                },
              ],
            });
          }

          const response = await fetch(modelConfig.url(apiEndpoint), {
            method: "POST",
            headers: modelConfig.headers(apiKey),
            body: JSON.stringify({
              model: modelConfig.requiresModelId ? model : modelConfig.defaultModel,
              response_format: {
                type: "json_object"
              },
              messages: [
                {
                  role: "system",
                  content: resolvedSystemPrompt
                },
                {
                  role: "user",
                  content
                }
              ],
              temperature: resolvedTemperature,
              top_p: resolvedTopP,
              max_tokens: resolvedMaxTokens,
            })
          });

          const data = await response.json();
          return Response.json(data);
        } catch (error) {
          console.error("Error in grammar check:", error);
          return Response.json(
            { error: formatGeminiErrorMessage(error) },
            { status: 500 }
          );
        }
      }
    }
  }
});
