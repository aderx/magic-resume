"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, ExternalLink, Link2, Sparkles } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DeepSeekLogo from "@/components/ai/icon/IconDeepseek";
import IconDoubao from "@/components/ai/icon/IconDoubao";
import IconOpenAi from "@/components/ai/icon/IconOpenAi";
import IconQwen from "@/components/ai/icon/IconQwen";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { AIModelType } from "@/config/ai";
import { cn } from "@/lib/utils";

type ProviderField = "apiKey" | "modelId" | "apiEndpoint";

type ProviderDefinition = {
  id: AIModelType;
  link: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  accentClass: string;
  surfaceClass: string;
  borderClass: string;
  fields: ProviderField[];
  apiEndpointValue?: string;
  apiEndpointReadonly?: boolean;
};

const AISettingsPage = () => {
  const {
    doubaoApiKey,
    doubaoModelId,
    deepseekApiKey,
    deepseekModelId,
    openaiApiKey,
    openaiModelId,
    openaiApiEndpoint,
    geminiApiKey,
    geminiModelId,
    qwenApiKey,
    qwenModelId,
    setDoubaoApiKey,
    setDoubaoModelId,
    setDeepseekApiKey,
    setDeepseekModelId,
    setOpenaiApiKey,
    setOpenaiModelId,
    setOpenaiApiEndpoint,
    setGeminiApiKey,
    setGeminiModelId,
    setQwenApiKey,
    setQwenModelId,
    polishTemperature,
    polishTopP,
    polishMaxTokens,
    polishSystemPrompt,
    grammarTemperature,
    grammarTopP,
    grammarMaxTokens,
    grammarSystemPrompt,
    setPolishTemperature,
    setPolishTopP,
    setPolishMaxTokens,
    setPolishSystemPrompt,
    setGrammarTemperature,
    setGrammarTopP,
    setGrammarMaxTokens,
    setGrammarSystemPrompt,
    selectedModel,
    setSelectedModel,
  } = useAIConfigStore();
  const [currentModel, setCurrentModel] = useState<AIModelType>(selectedModel);
  const t = useTranslations();

  useEffect(() => {
    setCurrentModel(selectedModel);
  }, [selectedModel]);

  const providers = useMemo<ProviderDefinition[]>(
    () => [
      {
        id: "qwen",
        link: "https://bailian.console.aliyun.com",
        icon: IconQwen,
        accentClass: "text-cyan-600 dark:text-cyan-400",
        surfaceClass: "bg-cyan-50 dark:bg-cyan-950/30",
        borderClass: "border-cyan-200/70 dark:border-cyan-900/70",
        fields: ["apiKey", "modelId", "apiEndpoint"],
        apiEndpointValue: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        apiEndpointReadonly: true,
      },
      {
        id: "deepseek",
        link: "https://platform.deepseek.com",
        icon: DeepSeekLogo,
        accentClass: "text-indigo-600 dark:text-indigo-400",
        surfaceClass: "bg-indigo-50 dark:bg-indigo-950/30",
        borderClass: "border-indigo-200/70 dark:border-indigo-900/70",
        fields: ["apiKey", "modelId"],
      },
      {
        id: "doubao",
        link: "https://console.volcengine.com/ark",
        icon: IconDoubao,
        accentClass: "text-blue-600 dark:text-blue-400",
        surfaceClass: "bg-blue-50 dark:bg-blue-950/30",
        borderClass: "border-blue-200/70 dark:border-blue-900/70",
        fields: ["apiKey", "modelId"],
      },
      {
        id: "openai",
        link: "https://platform.openai.com/api-keys",
        icon: IconOpenAi,
        accentClass: "text-emerald-600 dark:text-emerald-400",
        surfaceClass: "bg-emerald-50 dark:bg-emerald-950/30",
        borderClass: "border-emerald-200/70 dark:border-emerald-900/70",
        fields: ["apiKey", "modelId", "apiEndpoint"],
      },
      {
        id: "gemini",
        link: "https://aistudio.google.com/app/apikey",
        icon: Sparkles,
        accentClass: "text-amber-600 dark:text-amber-400",
        surfaceClass: "bg-amber-50 dark:bg-amber-950/30",
        borderClass: "border-amber-200/70 dark:border-amber-900/70",
        fields: ["apiKey", "modelId"],
      },

    ],
    []
  );

  const getProviderCopy = (providerId: AIModelType) => ({
    title: t(`dashboard.settings.ai.${providerId}.title`),
    description: t(`dashboard.settings.ai.${providerId}.description`),
    apiKey: t(`dashboard.settings.ai.${providerId}.apiKey`),
    modelId:
      providerId === "deepseek" ||
        providerId === "doubao" ||
        providerId === "openai" ||
        providerId === "gemini" ||
        providerId === "qwen"
        ? t(`dashboard.settings.ai.${providerId}.modelId`)
        : "",
    apiEndpoint:
      providerId === "openai" || providerId === "qwen"
        ? t(`dashboard.settings.ai.${providerId}.apiEndpoint`)
        : "",
  });

  const getProviderState = (providerId: AIModelType) => {
    switch (providerId) {
      case "doubao":
        return {
          apiKey: doubaoApiKey,
          modelId: doubaoModelId,
          apiEndpoint: "",
          isConfigured: Boolean(doubaoApiKey && doubaoModelId),
        };
      case "deepseek":
        return {
          apiKey: deepseekApiKey,
          modelId: deepseekModelId,
          apiEndpoint: "",
          isConfigured: Boolean(deepseekApiKey && deepseekModelId),
        };
      case "openai":
        return {
          apiKey: openaiApiKey,
          modelId: openaiModelId,
          apiEndpoint: openaiApiEndpoint,
          isConfigured: Boolean(openaiApiKey && openaiModelId && openaiApiEndpoint),
        };
      case "gemini":
        return {
          apiKey: geminiApiKey,
          modelId: geminiModelId,
          apiEndpoint: "",
          isConfigured: Boolean(geminiApiKey && geminiModelId),
        };
      case "qwen":
        return {
          apiKey: qwenApiKey,
          modelId: qwenModelId,
          apiEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
          isConfigured: Boolean(qwenApiKey && qwenModelId),
        };
    }
  };

  const setProviderValue = (
    providerId: AIModelType,
    field: ProviderField,
    value: string
  ) => {
    switch (providerId) {
      case "doubao":
        if (field === "apiKey") setDoubaoApiKey(value);
        if (field === "modelId") setDoubaoModelId(value);
        return;
      case "deepseek":
        if (field === "apiKey") setDeepseekApiKey(value);
        if (field === "modelId") setDeepseekModelId(value);
        return;
      case "openai":
        if (field === "apiKey") setOpenaiApiKey(value);
        if (field === "modelId") setOpenaiModelId(value);
        if (field === "apiEndpoint") setOpenaiApiEndpoint(value);
        return;
      case "gemini":
        if (field === "apiKey") setGeminiApiKey(value);
        if (field === "modelId") setGeminiModelId(value);
        return;
      case "qwen":
        if (field === "apiKey") setQwenApiKey(value);
        if (field === "modelId") setQwenModelId(value);
        return;
    }
  };

  const currentProvider =
    providers.find((provider) => provider.id === currentModel) ?? providers[0];
  const currentCopy = getProviderCopy(currentProvider.id);
  const currentState = getProviderState(currentProvider.id);
  const isSelected = selectedModel === currentProvider.id;
  const advancedSections = [
    {
      id: "polish" as const,
      title: t("dashboard.settings.ai.polishSettingsTitle"),
      description: t("dashboard.settings.ai.polishSettingsDescription"),
      temperature: polishTemperature,
      topP: polishTopP,
      maxTokens: polishMaxTokens,
      systemPrompt: polishSystemPrompt,
      setTemperature: setPolishTemperature,
      setTopP: setPolishTopP,
      setMaxTokens: setPolishMaxTokens,
      setSystemPrompt: setPolishSystemPrompt,
    },
    {
      id: "grammar" as const,
      title: t("dashboard.settings.ai.grammarSettingsTitle"),
      description: t("dashboard.settings.ai.grammarSettingsDescription"),
      temperature: grammarTemperature,
      topP: grammarTopP,
      maxTokens: grammarMaxTokens,
      systemPrompt: grammarSystemPrompt,
      setTemperature: setGrammarTemperature,
      setTopP: setGrammarTopP,
      setMaxTokens: setGrammarMaxTokens,
      setSystemPrompt: setGrammarSystemPrompt,
    },
  ];

  return (
    <div className="w-full px-6 py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs font-medium">
            {t("dashboard.settings.ai.currentModel")}:
            <span className="ml-2">{t(`dashboard.settings.ai.${selectedModel}.title`)}</span>
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("dashboard.settings.ai.title")}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {t("dashboard.settings.ai.pageDescription")}
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-8 xl:self-start">
            <div className="rounded-3xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
              <div className="mb-4 space-y-1 px-1">
                <h2 className="text-sm font-semibold text-foreground">
                  {t("dashboard.settings.ai.selectModel")}
                </h2>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t("dashboard.settings.ai.providerDescription")}
                </p>
              </div>

              <div className="space-y-3">
                {providers.map((provider) => {
                  const providerCopy = getProviderCopy(provider.id);
                  const providerState = getProviderState(provider.id);
                  const Icon = provider.icon;
                  const isActivePanel = currentModel === provider.id;
                  const isActiveModel = selectedModel === provider.id;

                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setCurrentModel(provider.id)}
                      className={cn(
                        "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                        provider.surfaceClass,
                        isActivePanel
                          ? cn(provider.borderClass, "shadow-sm ring-1 ring-primary/10")
                          : "border-border/60 hover:border-border hover:bg-accent/40"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                          "bg-white/80 dark:bg-background/60",
                          provider.accentClass
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {providerCopy.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {providerCopy.description}
                            </p>
                          </div>
                          {isActiveModel ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          ) : (
                            <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-muted-foreground/30" />
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <Badge
                            variant={providerState.isConfigured ? "default" : "secondary"}
                            className="rounded-full"
                          >
                            {providerState.isConfigured
                              ? t("common.configured")
                              : t("common.notConfigured")}
                          </Badge>
                          {isActiveModel && (
                            <span className="text-xs font-medium text-primary">
                              {t("dashboard.settings.ai.activeProvider")}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="rounded-[28px] border border-border/70 bg-card shadow-sm">
              <div className="border-b border-border/60 px-6 py-6 lg:px-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl",
                        currentProvider.surfaceClass,
                        currentProvider.accentClass
                      )}
                    >
                      <currentProvider.icon className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                          {currentCopy.title}
                        </h2>
                        <Badge
                          variant={currentState.isConfigured ? "default" : "secondary"}
                          className="rounded-full"
                        >
                          {currentState.isConfigured
                            ? t("common.configured")
                            : t("common.notConfigured")}
                        </Badge>
                      </div>
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        {currentCopy.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant={isSelected ? "secondary" : "default"}
                      className="rounded-xl px-5"
                      onClick={() => setSelectedModel(currentProvider.id)}
                    >
                      {isSelected ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          {t("dashboard.settings.ai.activeProvider")}
                        </>
                      ) : (
                        t("dashboard.settings.ai.useProvider")
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      asChild
                    >
                      <a href={currentProvider.link} target="_blank" rel="noreferrer">
                        {t("dashboard.settings.ai.getApiKey")}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
                <div className="min-w-0 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {currentProvider.fields.includes("apiKey") && (
                      <div className="space-y-3 md:col-span-2">
                        <Label className="text-sm font-medium text-foreground">
                          {currentCopy.apiKey}
                        </Label>
                        <Input
                          type="password"
                          value={currentState.apiKey}
                          onChange={(event) =>
                            setProviderValue(currentProvider.id, "apiKey", event.target.value)
                          }
                          placeholder={currentCopy.apiKey}
                          className="h-12 rounded-xl"
                        />
                      </div>
                    )}

                    {currentProvider.fields.includes("modelId") && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-foreground">
                          {currentCopy.modelId}
                        </Label>
                        <Input
                          value={currentState.modelId}
                          onChange={(event) =>
                            setProviderValue(currentProvider.id, "modelId", event.target.value)
                          }
                          placeholder={currentCopy.modelId}
                          className="h-12 rounded-xl"
                        />
                      </div>
                    )}

                    {currentProvider.fields.includes("apiEndpoint") && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-foreground">
                          {currentCopy.apiEndpoint}
                        </Label>
                        <Input
                          value={currentProvider.apiEndpointValue ?? currentState.apiEndpoint}
                          onChange={(event) =>
                            setProviderValue(currentProvider.id, "apiEndpoint", event.target.value)
                          }
                          placeholder={currentCopy.apiEndpoint}
                          className="h-12 rounded-xl"
                          readOnly={currentProvider.apiEndpointReadonly}
                          disabled={currentProvider.apiEndpointReadonly}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-border/70 bg-muted/30 p-5">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {t("dashboard.settings.ai.connectionTitle")}
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {t("dashboard.settings.ai.connectionDescription")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-background px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        {t("dashboard.settings.ai.currentModel")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {t(`dashboard.settings.ai.${selectedModel}.title`)}
                      </p>
                    </div>

                    {currentProvider.id === "qwen" && (
                      <div className="rounded-2xl bg-background px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                          {t("dashboard.settings.ai.qwen.compatibleMode")}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {t("dashboard.settings.ai.qwen.compatibleModeDescription")}
                        </p>
                      </div>
                    )}

                    <div className="rounded-2xl bg-background px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        {t("dashboard.settings.ai.recommendedField")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {currentProvider.id === "deepseek"
                          ? deepseekModelId || "deepseek-chat"
                          : currentProvider.id === "doubao"
                            ? "doubao-seed-1-6-flash-250615"
                            : currentProvider.id === "openai"
                              ? "gpt-4o-mini"
                              : currentProvider.id === "qwen"
                                ? "qwen-plus"
                                : "gemini-flash-latest"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[28px] border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border/60 px-6 py-6 lg:px-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("dashboard.settings.ai.advancedTitle")}
              </h2>
              <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
                {t("dashboard.settings.ai.advancedDescription")}
              </p>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 xl:grid-cols-2 lg:px-8">
            {advancedSections.map((section) => (
              <div
                key={section.id}
                className="rounded-3xl border border-border/70 bg-muted/20 p-5"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {section.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {section.description}
                  </p>
                </div>

                <div className="mt-6 grid gap-5">
                  <div className="grid gap-5 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("dashboard.settings.ai.temperature")}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={section.temperature}
                        onChange={(event) =>
                          section.setTemperature(Number(event.target.value || 0))
                        }
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("dashboard.settings.ai.topP")}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={section.topP}
                        onChange={(event) =>
                          section.setTopP(Number(event.target.value || 0))
                        }
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("dashboard.settings.ai.maxTokens")}
                      </Label>
                      <Input
                        type="number"
                        min="256"
                        max="16000"
                        step="256"
                        value={section.maxTokens}
                        onChange={(event) =>
                          section.setMaxTokens(Number(event.target.value || 0))
                        }
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {t("dashboard.settings.ai.systemPrompt")}
                    </Label>
                    <Textarea
                      value={section.systemPrompt}
                      onChange={(event) => section.setSystemPrompt(event.target.value)}
                      className="min-h-[360px] rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export const runtime = "edge";

export default AISettingsPage;
