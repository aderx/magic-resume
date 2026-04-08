import { NextResponse } from "next/server";
import {
  formatAIConfigurationTestError,
  testAIConfiguration,
} from "@/lib/server/ai-test";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await testAIConfiguration(body);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("AI configuration test error:", error);
    return NextResponse.json(
      { error: formatAIConfigurationTestError(error) },
      { status: 500 }
    );
  }
}

export const runtime = "edge";
