export type AIModelType = "doubao" | "deepseek" | "openai" | "gemini" | "qwen";

export interface AIOperationConfig {
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
}

export const DEFAULT_POLISH_SYSTEM_PROMPT = `你是一个专业的简历优化助手。请帮助优化以下 Markdown 格式的文本，使其更加专业和有吸引力。

优化原则：
1. 使用更专业的词汇和表达方式
2. 突出关键成就和技能
3. 保持简洁清晰
4. 使用主动语气
5. 保持原有信息的完整性
6. 严格保留原有的 Markdown 格式结构（列表项保持为列表项，加粗保持加粗等）

请直接返回优化后的 Markdown 文本，不要包含任何解释或其他内容。`;

export const DEFAULT_GRAMMAR_SYSTEM_PROMPT = `你是一个专业的中文简历校对助手。你的任务是**仅**找出简历中的**错别字**和**标点符号错误**。

**严格禁止**：
1. ❌ **禁止**提供任何风格、语气、润色或改写建议。如果句子在语法上是正确的（即使读起来不够优美），也**绝对不要**报错。
2. ❌ **禁止**报告“无明显错误”或类似的信息。如果没有发现错别字或标点错误，"errors" 数组必须为空。
3. ❌ **禁止**对专业术语进行过度纠正，除非通过上下文非常确定是打字错误。

**仅检查以下两类错误**：
1. ✅ **错别字**：例如将“作为”写成“做为”，将“经理”写成“经里”。
2. ✅ **严重标点错误**：仅报告重复标点（如“，，”）或完全错误的符号位置。

**重要例外（绝不报错）**：
- ❌ **忽略中英文标点混用**：在技术简历中，中文内容使用英文标点（如使用英文逗号, 代替中文逗号，或使用英文句点. 代替中文句号）是**完全接受**的风格。**绝对不要**报告此类“错误”。
- ❌ **忽略空格使用**：不要报告中英文之间的空格遗漏或多余。

返回格式示例（JSON）：
{
  "errors": [
    {
      "context": "包含错误的完整句子（必须是原文）",
      "text": "具体的错误部分（必须是原文中实际存在的字符串）",
      "suggestion": "仅包含修正后的词汇或片段（**不要**返回整句，除非整句都是错误的）",
      "reason": "错别字 / 标点错误",
      "type": "spelling"
    }
  ]
}

再次强调：**只找错别字和标点错误，不要做任何润色！**`;

export const DEFAULT_POLISH_CONFIG: AIOperationConfig = {
  temperature: 0.4,
  topP: 1,
  maxTokens: 4000,
  systemPrompt: DEFAULT_POLISH_SYSTEM_PROMPT,
};

export const DEFAULT_GRAMMAR_CONFIG: AIOperationConfig = {
  temperature: 0,
  topP: 1,
  maxTokens: 2000,
  systemPrompt: DEFAULT_GRAMMAR_SYSTEM_PROMPT,
};

export interface AIValidationContext {
  doubaoApiKey?: string;
  doubaoModelId?: string;
  doubaoApiEndpoint?: string;
  deepseekApiKey?: string;
  deepseekModelId?: string;
  deepseekApiEndpoint?: string;
  openaiApiKey?: string;
  openaiModelId?: string;
  openaiApiEndpoint?: string;
  geminiApiKey?: string;
  geminiModelId?: string;
  geminiApiEndpoint?: string;
  qwenApiKey?: string;
  qwenModelId?: string;
  qwenApiEndpoint?: string;
}

export interface AIModelConfig {
  url: (endpoint?: string) => string;
  requiresModelId: boolean;
  defaultModel?: string;
  headers: (apiKey: string) => Record<string, string>;
  validate: (context: AIValidationContext) => boolean;
}

export const normalizeApiEndpoint = (endpoint?: string) =>
  endpoint?.trim().replace(/\/+$/, "") ?? "";

export const DEFAULT_AI_API_ENDPOINTS: Record<AIModelType, string> = {
  doubao: "https://ark.cn-beijing.volces.com/api/v3",
  deepseek: "https://api.deepseek.com/v1",
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
};

export type ResolvedAIProviderConfig = {
  apiKey: string;
  modelId: string;
  apiEndpoint: string;
};

export const getAIProviderConfig = (
  providerId: AIModelType,
  context: AIValidationContext
): ResolvedAIProviderConfig => {
  switch (providerId) {
    case "doubao":
      return {
        apiKey: context.doubaoApiKey ?? "",
        modelId: context.doubaoModelId ?? "",
        apiEndpoint: context.doubaoApiEndpoint ?? "",
      };
    case "deepseek":
      return {
        apiKey: context.deepseekApiKey ?? "",
        modelId: context.deepseekModelId ?? "",
        apiEndpoint: context.deepseekApiEndpoint ?? "",
      };
    case "openai":
      return {
        apiKey: context.openaiApiKey ?? "",
        modelId: context.openaiModelId ?? "",
        apiEndpoint: context.openaiApiEndpoint ?? "",
      };
    case "gemini":
      return {
        apiKey: context.geminiApiKey ?? "",
        modelId: context.geminiModelId ?? "",
        apiEndpoint: context.geminiApiEndpoint ?? "",
      };
    case "qwen":
      return {
        apiKey: context.qwenApiKey ?? "",
        modelId: context.qwenModelId ?? "",
        apiEndpoint: context.qwenApiEndpoint ?? "",
      };
  }
};

const validateAIProviderConfig = (
  providerId: AIModelType,
  context: AIValidationContext
) => {
  const config = getAIProviderConfig(providerId, context);

  return !!(
    config.apiKey.trim() &&
    config.modelId.trim() &&
    normalizeApiEndpoint(config.apiEndpoint)
  );
};

export const AI_MODEL_CONFIGS: Record<AIModelType, AIModelConfig> = {
  doubao: {
    url: (endpoint?: string) => `${normalizeApiEndpoint(endpoint)}/chat/completions`,
    requiresModelId: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) =>
      validateAIProviderConfig("doubao", context),
  },
  deepseek: {
    url: (endpoint?: string) => `${normalizeApiEndpoint(endpoint)}/chat/completions`,
    requiresModelId: true,
    defaultModel: "deepseek-chat",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) =>
      validateAIProviderConfig("deepseek", context),
  },
  openai: {
    url: (endpoint?: string) => `${normalizeApiEndpoint(endpoint)}/chat/completions`,
    requiresModelId: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) =>
      validateAIProviderConfig("openai", context),
  },
  gemini: {
    url: (endpoint?: string) => normalizeApiEndpoint(endpoint),
    requiresModelId: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    }),
    validate: (context: AIValidationContext) =>
      validateAIProviderConfig("gemini", context),
  },
  qwen: {
    url: (endpoint?: string) => `${normalizeApiEndpoint(endpoint)}/chat/completions`,
    requiresModelId: true,
    defaultModel: "qwen-plus",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) =>
      validateAIProviderConfig("qwen", context),
  },
};
