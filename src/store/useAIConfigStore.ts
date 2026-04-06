import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AI_MODEL_CONFIGS,
  AIModelType,
  DEFAULT_GRAMMAR_CONFIG,
  DEFAULT_POLISH_CONFIG,
} from "@/config/ai";

interface AIConfigState {
  selectedModel: AIModelType;
  doubaoApiKey: string;
  doubaoModelId: string;
  deepseekApiKey: string;
  deepseekModelId: string;
  openaiApiKey: string;
  openaiModelId: string;
  openaiApiEndpoint: string;
  geminiApiKey: string;
  geminiModelId: string;
  qwenApiKey: string;
  qwenModelId: string;
  polishTemperature: number;
  polishTopP: number;
  polishMaxTokens: number;
  polishSystemPrompt: string;
  grammarTemperature: number;
  grammarTopP: number;
  grammarMaxTokens: number;
  grammarSystemPrompt: string;
  setSelectedModel: (model: AIModelType) => void;
  setDoubaoApiKey: (apiKey: string) => void;
  setDoubaoModelId: (modelId: string) => void;
  setDeepseekApiKey: (apiKey: string) => void;
  setDeepseekModelId: (modelId: string) => void;
  setOpenaiApiKey: (apiKey: string) => void;
  setOpenaiModelId: (modelId: string) => void;
  setOpenaiApiEndpoint: (endpoint: string) => void;
  setGeminiApiKey: (apiKey: string) => void;
  setGeminiModelId: (modelId: string) => void;
  setQwenApiKey: (apiKey: string) => void;
  setQwenModelId: (modelId: string) => void;
  setPolishTemperature: (value: number) => void;
  setPolishTopP: (value: number) => void;
  setPolishMaxTokens: (value: number) => void;
  setPolishSystemPrompt: (value: string) => void;
  setGrammarTemperature: (value: number) => void;
  setGrammarTopP: (value: number) => void;
  setGrammarMaxTokens: (value: number) => void;
  setGrammarSystemPrompt: (value: string) => void;
  isConfigured: () => boolean;
}

export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set, get) => ({
      selectedModel: "doubao",
      doubaoApiKey: "",
      doubaoModelId: "",
      deepseekApiKey: "",
      deepseekModelId: "deepseek-chat",
      openaiApiKey: "",
      openaiModelId: "",
      openaiApiEndpoint: "",
      geminiApiKey: "",
      geminiModelId: "gemini-flash-latest",
      qwenApiKey: "",
      qwenModelId: "qwen-plus",
      polishTemperature: DEFAULT_POLISH_CONFIG.temperature,
      polishTopP: DEFAULT_POLISH_CONFIG.topP,
      polishMaxTokens: DEFAULT_POLISH_CONFIG.maxTokens,
      polishSystemPrompt: DEFAULT_POLISH_CONFIG.systemPrompt,
      grammarTemperature: DEFAULT_GRAMMAR_CONFIG.temperature,
      grammarTopP: DEFAULT_GRAMMAR_CONFIG.topP,
      grammarMaxTokens: DEFAULT_GRAMMAR_CONFIG.maxTokens,
      grammarSystemPrompt: DEFAULT_GRAMMAR_CONFIG.systemPrompt,
      setSelectedModel: (model: AIModelType) => set({ selectedModel: model }),
      setDoubaoApiKey: (apiKey: string) => set({ doubaoApiKey: apiKey }),
      setDoubaoModelId: (modelId: string) => set({ doubaoModelId: modelId }),
      setDeepseekApiKey: (apiKey: string) => set({ deepseekApiKey: apiKey }),
      setDeepseekModelId: (modelId: string) => set({ deepseekModelId: modelId }),
      setOpenaiApiKey: (apiKey: string) => set({ openaiApiKey: apiKey }),
      setOpenaiModelId: (modelId: string) => set({ openaiModelId: modelId }),
      setOpenaiApiEndpoint: (endpoint: string) => set({ openaiApiEndpoint: endpoint }),
      setGeminiApiKey: (apiKey: string) => set({ geminiApiKey: apiKey }),
      setGeminiModelId: (modelId: string) => set({ geminiModelId: modelId }),
      setQwenApiKey: (apiKey: string) => set({ qwenApiKey: apiKey }),
      setQwenModelId: (modelId: string) => set({ qwenModelId: modelId }),
      setPolishTemperature: (value: number) => set({ polishTemperature: value }),
      setPolishTopP: (value: number) => set({ polishTopP: value }),
      setPolishMaxTokens: (value: number) => set({ polishMaxTokens: value }),
      setPolishSystemPrompt: (value: string) => set({ polishSystemPrompt: value }),
      setGrammarTemperature: (value: number) => set({ grammarTemperature: value }),
      setGrammarTopP: (value: number) => set({ grammarTopP: value }),
      setGrammarMaxTokens: (value: number) => set({ grammarMaxTokens: value }),
      setGrammarSystemPrompt: (value: string) => set({ grammarSystemPrompt: value }),
      isConfigured: () => {
        const state = get();
        const config = AI_MODEL_CONFIGS[state.selectedModel];
        return config.validate(state);
      }
    }),
    {
      name: "ai-config-storage"
    }
  )
);
