import { createFileRoute } from "@tanstack/react-router";
import {
  formatAIConfigurationTestError,
  testAIConfiguration,
} from "@/lib/server/ai-test";

export const Route = createFileRoute("/api/ai/test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const result = await testAIConfiguration(body);

          return Response.json({
            success: true,
            message: result.message,
          });
        } catch (error) {
          console.error("AI configuration test error:", error);
          return Response.json(
            { error: formatAIConfigurationTestError(error) },
            { status: 500 }
          );
        }
      },
    },
  },
});
