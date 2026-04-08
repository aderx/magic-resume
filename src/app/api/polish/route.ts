import { NextResponse } from "next/server";
import {
  AI_MODEL_CONFIGS,
  AIModelType,
  DEFAULT_POLISH_CONFIG,
} from "@/config/ai";
import {
  createGeminiTextContent,
  formatGeminiErrorMessage,
  requestGeminiContent,
} from "@/lib/server/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, model, content, modelType, apiEndpoint, temperature, topP, maxTokens, systemPrompt, customInstructions } = body;

    const modelConfig = AI_MODEL_CONFIGS[modelType as AIModelType];
    if (!modelConfig) {
      throw new Error("Invalid model type");
    }

    let resolvedSystemPrompt = systemPrompt?.trim() || DEFAULT_POLISH_CONFIG.systemPrompt;
    const resolvedTemperature = typeof temperature === "number" ? temperature : DEFAULT_POLISH_CONFIG.temperature;
    const resolvedTopP = typeof topP === "number" ? topP : DEFAULT_POLISH_CONFIG.topP;
    const resolvedMaxTokens = typeof maxTokens === "number" ? maxTokens : DEFAULT_POLISH_CONFIG.maxTokens;

    if (customInstructions?.trim()) {
      resolvedSystemPrompt += `\n\n用户额外要求：\n${customInstructions.trim()}`;
    }

    if (modelType === "gemini") {
      const geminiModel = model || "gemini-flash-latest";
      const text = await requestGeminiContent({
        apiKey,
        apiEndpoint,
        model: geminiModel,
        contents: [createGeminiTextContent(content)],
        systemInstruction: resolvedSystemPrompt,
        generationConfig: {
          temperature: resolvedTemperature,
          topP: resolvedTopP,
          maxOutputTokens: resolvedMaxTokens,
        },
      });

      return new Response(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const response = await fetch(modelConfig.url(apiEndpoint), {
      method: "POST",
      headers: modelConfig.headers(apiKey),
      body: JSON.stringify({
        model: modelConfig.requiresModelId ? model : modelConfig.defaultModel,
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
        stream: true,
        temperature: resolvedTemperature,
        top_p: resolvedTopP,
        max_tokens: resolvedMaxTokens,
      }),
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk
              .split("\n")
              .filter((line) => line.trim() !== "");

            for (const line of lines) {
              if (line.includes("[DONE]")) continue;
              if (!line.startsWith("data:")) continue;

              try {
                const data = JSON.parse(line.slice(5));
                const content = data.choices[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch (e) {
                console.error("Error parsing JSON:", e);
              }
            }
          }
        } catch (error) {
          console.error("Stream reading error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Polish error:", error);
    return NextResponse.json(
      { error: formatGeminiErrorMessage(error) },
      { status: 500 }
    );
  }
}

export const runtime = "edge";
