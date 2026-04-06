import { NextRequest, NextResponse } from "next/server";
import {
  AI_MODEL_CONFIGS,
  AIModelType,
  DEFAULT_GRAMMAR_CONFIG,
} from "@/config/ai";
import { formatGeminiErrorMessage, getGeminiModelInstance } from "@/lib/server/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, model, content, modelType, apiEndpoint, temperature, topP, maxTokens, systemPrompt } = body;

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
      const modelInstance = getGeminiModelInstance({
        apiKey,
        model: geminiModel,
        systemInstruction: resolvedSystemPrompt,
        generationConfig: {
          temperature: resolvedTemperature,
          topP: resolvedTopP,
          maxOutputTokens: resolvedMaxTokens,
          responseMimeType: "application/json",
        },
      });

      const result = await modelInstance.generateContent(content);
      const text = result.response.text() || "";

      return NextResponse.json({
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
        temperature: resolvedTemperature,
        top_p: resolvedTopP,
        max_tokens: resolvedMaxTokens,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: resolvedSystemPrompt,
          },
          {
            role: "user",
            content: content,
          },
        ],
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in grammar check:", error);
    return NextResponse.json(
      { error: formatGeminiErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const runtime = "edge";
