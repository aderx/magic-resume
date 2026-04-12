"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
  Square,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/i18n/compat/client";
import { createMarkdownExit } from "markdown-exit";
import TurndownService from "turndown";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter as AlertDialogFooterActions,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

interface PolishHistoryEntry {
  id: string;
  createdAt: string;
  content: string;
  markdown: string;
  isStreaming?: boolean;
}

type PolishPhase = "idle" | "pending" | "reasoning" | "content";

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

const createPolishHistoryId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatPolishHistoryLabel = (timestamp: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));

export default function AIPolishDialog({
  open,
  onOpenChange,
  content,
  onApply
}: AIPolishDialogProps) {
  const t = useTranslations("aiPolishDialog");
  const settingsT = useTranslations("dashboard.settings.ai");
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishPhase, setPolishPhase] = useState<PolishPhase>("idle");
  const [sourceContent, setSourceContent] = useState(content);
  const [polishHistory, setPolishHistory] = useState<PolishHistoryEntry[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [, setStreamingMarkdown] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isCustomInstructionsExpanded, setIsCustomInstructionsExpanded] =
    useState(false);
  const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
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
  const activeLiveEntryIdRef = useRef<string | null>(null);
  const discardCurrentRunRef = useRef(false);
  const previousSelectedHistoryIdRef = useRef<string | null>(null);
  const polishedContentRef = useRef<HTMLDivElement>(null);
  const defaultCustomInstructions = t("defaultCustomInstructions");
  const selectedHistoryEntry = useMemo(
    () =>
      polishHistory.find((entry) => entry.id === selectedHistoryId) ??
      polishHistory[0] ??
      null,
    [polishHistory, selectedHistoryId]
  );
  const shouldShowPolishedPanel = Boolean(
    selectedHistoryEntry &&
      (selectedHistoryEntry.isStreaming
        ? selectedHistoryEntry.markdown.length > 0
        : selectedHistoryEntry.content.trim())
  );
  const hasCompletedPolish = Boolean(
    !isPolishing &&
      selectedHistoryEntry &&
      !selectedHistoryEntry.isStreaming &&
      selectedHistoryEntry.content.trim()
  );
  const currentModelTitle = settingsT(`${selectedModel}.title`);
  const displayedPolishedContent = selectedHistoryEntry?.content || "";
  const polishActionLabel =
    polishPhase === "reasoning"
      ? t("button.thinking")
      : t("button.generating");

  const handlePolish = async () => {
    const startedAt = new Date().toISOString();
    const liveEntryId = `live-${createPolishHistoryId()}`;

    try {
      if (!isConfigured()) {
        toast.error(t("error.configRequired"));
        onOpenChange(false);
        return;
      }

      previousSelectedHistoryIdRef.current = selectedHistoryEntry?.id ?? null;
      discardCurrentRunRef.current = false;
      setIsPolishing(true);
      setPolishPhase("pending");
      setStreamingMarkdown("");

      abortControllerRef.current = new AbortController();
      let nextMarkdown = "";
      const nextLiveEntry: PolishHistoryEntry = {
        id: liveEntryId,
        createdAt: startedAt,
        markdown: "",
        content: "",
        isStreaming: true,
      };

      activeLiveEntryIdRef.current = liveEntryId;
      setPolishHistory((prev) => [nextLiveEntry, ...prev]);
      setSelectedHistoryId(liveEntryId);

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
          if (discardCurrentRunRef.current) return;

          nextMarkdown += chunk;
          setPolishPhase("content");
          setStreamingMarkdown(nextMarkdown);
          const renderedContent = md.render(nextMarkdown);

          setPolishHistory((prev) =>
            prev.map((entry) =>
              entry.id === liveEntryId
                ? {
                    ...entry,
                    markdown: nextMarkdown,
                    content: renderedContent,
                  }
                : entry
            )
          );
        },
        onReasoningDelta: () => {
          if (discardCurrentRunRef.current) return;
          if (!nextMarkdown) {
            setPolishPhase("reasoning");
          }
        },
      });

      if (discardCurrentRunRef.current) {
        return;
      }

      if (nextMarkdown.trim()) {
        const finalEntryId = createPolishHistoryId();

        setPolishHistory((prev) =>
          prev.map((entry) =>
            entry.id === liveEntryId
              ? {
                  ...entry,
                  id: finalEntryId,
                  isStreaming: false,
                }
              : entry
          )
        );
        setSelectedHistoryId(finalEntryId);
      } else {
        setPolishHistory((prev) =>
          prev.filter((entry) => entry.id !== liveEntryId)
        );
        setSelectedHistoryId(previousSelectedHistoryIdRef.current);
      }
    } catch (error) {
      setPolishHistory((prev) => prev.filter((entry) => entry.id !== liveEntryId));
      setSelectedHistoryId(previousSelectedHistoryIdRef.current);

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
      setStreamingMarkdown("");
      setIsPolishing(false);
      setPolishPhase("idle");
      activeLiveEntryIdRef.current = null;
      discardCurrentRunRef.current = false;
    }
  };

  useEffect(() => {
    if (selectedHistoryEntry?.content && polishedContentRef.current) {
      const container = polishedContentRef.current.querySelector(".tiptap") as HTMLElement | null;
      if (!container) return;

      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [selectedHistoryEntry?.content]);

  useEffect(() => {
    if (open) {
      setSourceContent(content);
      setPolishHistory([]);
      setSelectedHistoryId(null);
      setStreamingMarkdown("");
      setPolishPhase("idle");
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
      setPolishHistory([]);
      setSelectedHistoryId(null);
      setStreamingMarkdown("");
      setPolishPhase("idle");
      setCustomInstructions(defaultCustomInstructions);
      setIsCustomInstructionsExpanded(false);
    }
  }, [content, defaultCustomInstructions, open]);

  const handleClose = () => {
    if (abortControllerRef.current) {
      discardCurrentRunRef.current = true;
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    onOpenChange(false);
    setPolishHistory([]);
    setSelectedHistoryId(null);
    setStreamingMarkdown("");
    setPolishPhase("idle");
  };

  const handleAbortPolish = () => {
    discardCurrentRunRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (activeLiveEntryIdRef.current) {
      const liveEntryId = activeLiveEntryIdRef.current;
      setPolishHistory((prev) =>
        prev.filter((entry) => entry.id !== liveEntryId)
      );
      setSelectedHistoryId(previousSelectedHistoryIdRef.current);
    }

    setStreamingMarkdown("");
    setIsPolishing(false);
    setPolishPhase("idle");
    setIsStopConfirmOpen(false);
  };

  const handleApply = () => {
    if (!selectedHistoryEntry?.content) return;

    onApply(selectedHistoryEntry.content);
    handleClose();
    toast.success(t("error.applied"));
  };

  const handlePolishedContentChange = (nextContent: string) => {
    if (!selectedHistoryEntry) return;

    setPolishHistory((prev) =>
      prev.map((entry) =>
        entry.id === selectedHistoryEntry.id
          ? { ...entry, content: nextContent }
          : entry
      )
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
      return;
    }

    onOpenChange(open);
  };

  const toggleCustomInstructions = () => {
    setIsCustomInstructionsExpanded((value) => !value);
  };

  const handleCustomInstructionsKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    toggleCustomInstructions();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            "w-[calc(100vw-1rem)] overflow-hidden p-0 transition-[max-width] duration-300 sm:rounded-2xl [&>button.absolute]:right-5 [&>button.absolute]:top-5 [&>button.absolute]:rounded-md [&>button.absolute]:p-1.5 [&>button.absolute_svg]:h-5 [&>button.absolute_svg]:w-5",
          shouldShowPolishedPanel ? "max-w-[1180px]" : "max-w-[760px]"
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
            <DialogTitle className="flex items-center gap-3 text-2xl font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("title")}
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="/app/dashboard/ai"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                    >
                      {currentModelTitle}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-[260px] whitespace-normal break-words leading-5"
                  >
                    <p>{t("modelTagHint", { model: currentModelTitle })}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto px-6 py-5 sm:px-7">
            <div className="flex min-h-full min-w-0 flex-col gap-5">
              <div
                className={cn(
                  "grid min-h-0 shrink-0 gap-5",
                  shouldShowPolishedPanel && "xl:grid-cols-2"
                )}
              >
                <div className="flex min-w-0 min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex min-h-14 items-center border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      {t("content.original")}
                    </p>
                  </div>

                  <RichTextEditor
                    content={sourceContent}
                    onChange={setSourceContent}
                    editable={!isPolishing}
                    className="h-[440px] min-h-0 rounded-none border-0 bg-background shadow-none"
                    toolbarClassName="border-border px-3 py-2"
                    contentClassName="min-h-0 flex-1 overflow-hidden"
                    editorClassName="tiptap-scrollable h-full min-h-0 break-words px-4 py-4 text-foreground"
                  />
                </div>

                {shouldShowPolishedPanel && (
                  <div className="flex min-w-0 min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">
                        {t("content.polished")}
                      </p>
                      <Select
                        value={selectedHistoryEntry?.id || undefined}
                        onValueChange={setSelectedHistoryId}
                      >
                        <SelectTrigger className="h-8 w-[168px] rounded-lg text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {polishHistory.map((entry) => (
                            <SelectItem key={entry.id} value={entry.id}>
                              {entry.isStreaming
                                ? t("button.generating")
                                : formatPolishHistoryLabel(entry.createdAt)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div ref={polishedContentRef} className="relative min-h-0 flex-1">
                      <RichTextEditor
                        content={displayedPolishedContent}
                        onChange={handlePolishedContentChange}
                        editable={!isPolishing}
                        className="h-[440px] min-h-0 rounded-none border-0 bg-background shadow-none"
                        toolbarClassName="border-border px-3 py-2"
                        contentClassName="min-h-0 flex-1 overflow-hidden"
                        editorClassName="tiptap-scrollable h-full min-h-0 break-words px-4 py-4 text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div
                  className="flex cursor-pointer select-none items-center justify-between gap-3 px-4 py-3"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isCustomInstructionsExpanded}
                  aria-label={
                    isCustomInstructionsExpanded
                      ? t("hideCustomInstructions")
                      : t("showCustomInstructions")
                  }
                  onClick={toggleCustomInstructions}
                  onKeyDown={handleCustomInstructionsKeyDown}
                >
                  <p className="text-sm font-medium text-foreground">
                    {t("customInstructions")}
                  </p>

                  <div className="flex items-center gap-2">
                    {isCustomInstructionsExpanded && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        onClick={(event) => {
                          event.stopPropagation();
                          setCustomInstructions(defaultCustomInstructions);
                        }}
                        aria-label={t("resetCustomInstructions")}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground">
                      {isCustomInstructionsExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </div>
                </div>

                {isCustomInstructionsExpanded && (
                  <div>
                    <Textarea
                      id="custom-instructions"
                      placeholder={t("customInstructionsPlaceholder")}
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      disabled={isPolishing}
                      rows={4}
                      className="resize-none rounded-none border-0 border-t border-border bg-background text-sm leading-6 text-foreground shadow-none focus-visible:ring-0"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border bg-background px-6 py-5 sm:px-7">
            <div
              className={cn(
                "flex w-full gap-3",
                shouldShowPolishedPanel ? "justify-center" : "justify-center"
              )}
            >
              {!hasCompletedPolish ? (
                <>
                  <Button
                    onClick={!isPolishing ? handlePolish : undefined}
                    disabled={isPolishing}
                    className="h-11 min-w-[240px] rounded-xl"
                  >
                    {isPolishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {polishActionLabel}
                      </>
                    ) : (
                      t("button.start")
                    )}
                  </Button>
                  {isPolishing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-xl"
                      title={t("button.stop")}
                      aria-label={t("button.stop")}
                      onClick={() => setIsStopConfirmOpen(true)}
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handlePolish}
                    disabled={isPolishing}
                    variant="outline"
                    className="h-11 min-w-[220px] rounded-xl"
                  >
                    {isPolishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {polishActionLabel}
                      </>
                    ) : (
                      t("button.regenerate")
                    )}
                  </Button>
                  {isPolishing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-xl"
                      title={t("button.stop")}
                      aria-label={t("button.stop")}
                      onClick={() => setIsStopConfirmOpen(true)}
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </Button>
                  )}

                  <Button
                    onClick={handleApply}
                    disabled={!selectedHistoryEntry?.content || isPolishing}
                    className="h-11 min-w-[220px] rounded-xl"
                  >
                    {t("button.apply")}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>

      <AlertDialog open={isStopConfirmOpen} onOpenChange={setIsStopConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("stopDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("stopDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooterActions>
            <AlertDialogCancel>{t("stopDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleAbortPolish}>
              {t("stopDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooterActions>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
