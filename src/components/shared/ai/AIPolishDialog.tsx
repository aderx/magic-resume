"use client";

import { useEffect, useState, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/i18n/compat/client";
import { createMarkdownExit } from "markdown-exit";
import TurndownService from "turndown";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/shared/rich-editor/RichEditor";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { AI_MODEL_CONFIGS, getAIProviderConfig } from "@/config/ai";
import { polishContentDirect } from "@/lib/ai/direct-client";
import { cn } from "@/lib/utils";

interface AIPolishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onApply: (content: string) => void;
}

// markdown-exit 实例，用于将 AI 返回的 Markdown 转换为 Tiptap 兼容的 HTML
const md = createMarkdownExit({
  html: true,       // 允许 HTML 标签透传
  breaks: true,     // 将换行符转换为 <br>
  linkify: false,   // 简历内容不需要自动识别链接
});

// turndown 实例，用于将 Tiptap HTML 转换为 Markdown 发给 AI
const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
});

export default function AIPolishDialog({
  open,
  onOpenChange,
  content,
  onApply
}: AIPolishDialogProps) {
  const t = useTranslations("aiPolishDialog");
  const [isPolishing, setIsPolishing] = useState(false);
  const [sourceContent, setSourceContent] = useState(content);
  const [polishedContent, setPolishedContent] = useState("");
  const [polishedMarkdown, setPolishedMarkdown] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isCustomInstructionsExpanded, setIsCustomInstructionsExpanded] =
    useState(false);
  const {
    selectedModel,
    doubaoApiKey,
    doubaoModelId,
    doubaoApiEndpoint,
    deepseekApiKey,
    deepseekModelId,
    deepseekApiEndpoint,
    openaiApiKey,
    openaiModelId,
    openaiApiEndpoint,
    geminiApiKey,
    geminiModelId,
    geminiApiEndpoint,
    qwenApiKey,
    qwenModelId,
    qwenApiEndpoint,
    polishTemperature,
    polishTopP,
    polishMaxTokens,
    polishSystemPrompt,
    isConfigured
  } = useAIConfigStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const polishedContentRef = useRef<HTMLDivElement>(null);
  const defaultCustomInstructions = t("defaultCustomInstructions");

  const handlePolish = async () => {
    try {
      if (!isConfigured()) {
        toast.error(t("error.configRequired"));
        onOpenChange(false);
        return;
      }

      setIsPolishing(true);
      setPolishedMarkdown("");
      setPolishedContent("");

      abortControllerRef.current = new AbortController();

      const config = AI_MODEL_CONFIGS[selectedModel];
      const providerConfig = getAIProviderConfig(selectedModel, {
        doubaoApiKey,
        doubaoModelId,
        doubaoApiEndpoint,
        deepseekApiKey,
        deepseekModelId,
        deepseekApiEndpoint,
        openaiApiKey,
        openaiModelId,
        openaiApiEndpoint,
        geminiApiKey,
        geminiModelId,
        geminiApiEndpoint,
        qwenApiKey,
        qwenModelId,
        qwenApiEndpoint,
      });

      await polishContentDirect({
        content: turndownService.turndown(sourceContent),
        apiKey: providerConfig.apiKey,
        apiEndpoint: providerConfig.apiEndpoint,
        model: config.requiresModelId ? providerConfig.modelId : config.defaultModel ?? "",
        modelType: selectedModel,
        customInstructions: customInstructions.trim() || undefined,
        temperature: polishTemperature,
        topP: polishTopP,
        maxTokens: polishMaxTokens,
        systemPrompt: polishSystemPrompt,
        signal: abortControllerRef.current.signal,
        onDelta: (chunk) => {
          setPolishedMarkdown((prev) => prev + chunk);
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Polish aborted");
        return;
      }
      console.error("Polish error:", error);
      const message =
        error instanceof Error && error.message
          ? `${t("error.polishFailed")}: ${error.message}`
          : t("error.polishFailed");
      toast.error(message);
    } finally {
      setIsPolishing(false);
    }
  };

  useEffect(() => {
    if (!polishedMarkdown) {
      setPolishedContent("");
      return;
    }

    setPolishedContent(md.render(polishedMarkdown));
  }, [polishedMarkdown]);

  useEffect(() => {
    if (polishedMarkdown && polishedContentRef.current) {
      const container = polishedContentRef.current;
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [polishedMarkdown]);

  useEffect(() => {
    if (open) {
      setSourceContent(content);
      setPolishedMarkdown("");
      setPolishedContent("");
      setCustomInstructions(defaultCustomInstructions);
      setIsCustomInstructionsExpanded(false);
      return;
    }

    if (!open) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setSourceContent(content);
      setPolishedMarkdown("");
      setPolishedContent("");
      setCustomInstructions(defaultCustomInstructions);
      setIsCustomInstructionsExpanded(false);
    }
  }, [content, defaultCustomInstructions, open]);

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    onOpenChange(false);
    setPolishedMarkdown("");
    setPolishedContent("");
  };

  const handleApply = () => {
    onApply(polishedContent);
    handleClose();
    toast.success(t("error.applied"));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
      return;
    }

    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "w-[calc(100vw-1rem)] max-w-[1280px] overflow-hidden p-0 sm:rounded-2xl"
        )}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <div className="grid h-[90vh] max-h-[920px] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-background">
          <DialogHeader className="border-b border-border px-6 py-5 sm:px-7">
            <DialogTitle className="flex items-center gap-2 text-2xl font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("title")}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
              {isPolishing
                ? t("description.polishing")
                : polishedContent
                  ? t("description.finished")
                  : t("description.ready")}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto px-6 py-5 sm:px-7">
            <div className="flex min-h-full flex-col gap-5">
              <div className="grid min-h-0 gap-5 xl:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      {t("content.original")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {t("content.originalDescription")}
                    </p>
                  </div>

                  <div className="p-4">
                    <RichTextEditor
                      content={sourceContent}
                      onChange={setSourceContent}
                      className="h-[440px] min-h-0 rounded-xl border border-border bg-background shadow-none"
                      toolbarClassName="border-border bg-muted/30 px-3 py-2"
                      contentClassName="min-h-0 flex-1 overflow-hidden"
                      editorClassName="tiptap-scrollable h-full min-h-full break-words px-4 py-4 text-foreground"
                    />
                  </div>
                </div>

                <div className="min-w-0 rounded-2xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      {t("content.polished")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {t("content.polishedDescription")}
                    </p>
                  </div>

                  <div className="p-4">
                    <div ref={polishedContentRef} className="relative">
                      <RichTextEditor
                        content={polishedContent}
                        onChange={setPolishedContent}
                        className="h-[440px] min-h-0 rounded-xl border border-border bg-background shadow-none"
                        toolbarClassName="border-border bg-muted/30 px-3 py-2"
                        contentClassName="min-h-0 flex-1 overflow-hidden"
                        editorClassName="tiptap-scrollable h-full min-h-full break-words px-4 py-4 text-foreground"
                      />
                      {isPolishing && (
                        <div className="absolute inset-0 rounded-xl bg-background/70 backdrop-blur-[1px]" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("customInstructions")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {t("customInstructionsHint")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCustomInstructionsExpanded && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        onClick={() => setCustomInstructions(defaultCustomInstructions)}
                        aria-label={t("resetCustomInstructions")}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() =>
                        setIsCustomInstructionsExpanded((value) => !value)
                      }
                    >
                      {isCustomInstructionsExpanded ? (
                        <ChevronUp className="mr-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="mr-2 h-4 w-4" />
                      )}
                      {isCustomInstructionsExpanded
                        ? t("hideCustomInstructions")
                        : t("showCustomInstructions")}
                    </Button>
                  </div>
                </div>

                {isCustomInstructionsExpanded && (
                  <div className="px-4 py-4">
                    <Textarea
                      id="custom-instructions"
                      placeholder={t("customInstructionsPlaceholder")}
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      disabled={isPolishing}
                      rows={4}
                      className="resize-none rounded-xl border-border bg-background text-sm leading-6 text-foreground"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border bg-background px-6 py-5 sm:px-7">
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleClose}
                variant="outline"
                className="h-11 flex-1 rounded-xl"
              >
                {t("button.cancel")}
              </Button>

              <Button
                onClick={handlePolish}
                disabled={isPolishing}
                className="h-11 flex-1 rounded-xl"
              >
                {isPolishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("button.generating")}
                  </>
                ) : !polishedContent ? (
                  t("button.start")
                ) : (
                  t("button.regenerate")
                )}
              </Button>

              <Button
                onClick={handleApply}
                disabled={!polishedContent || isPolishing}
                variant="outline"
                className="h-11 flex-1 rounded-xl"
              >
                {t("button.apply")}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
