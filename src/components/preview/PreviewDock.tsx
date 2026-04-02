"use client";

import { Dock, DockIcon } from "@/components/magicui/dock";
import TemplateSheet from "@/components/shared/TemplateSheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useAIConfiguration } from "@/hooks/useAIConfiguration";
import { useGrammarCheck } from "@/hooks/useGrammarCheck";
import { useTranslations } from "@/i18n/compat/client";
import { cn } from "@/lib/utils";
import {
  SpellCheck2
} from "lucide-react";
import React, { useCallback } from "react";
import { toast } from "sonner";

export type IconProps = React.HTMLAttributes<SVGElement>;

interface PreviewDockProps {

  resumeContentRef: React.RefObject<HTMLDivElement>;
}

const PreviewDock = ({
  resumeContentRef
}: PreviewDockProps) => {
  const t = useTranslations("previewDock");
  const { checkGrammar, isChecking } = useGrammarCheck();
  const { checkConfiguration } = useAIConfiguration();

  // ... (keep other hooks)

  const handleGrammarCheck = useCallback(async () => {
    if (!checkConfiguration()) {
      return;
    }

    try {
      const previewContent =
        resumeContentRef.current || document.getElementById("resume-preview");
      if (!previewContent) {
        toast.error(t("grammarCheck.errorToast"));
        return;
      }

      const text = previewContent.innerText?.trim();
      if (!text) {
        toast.error(t("grammarCheck.errorToast"));
        return;
      }

      await checkGrammar(text);
    } catch (error) {
      toast.error(t("grammarCheck.errorToast"));
    }
  }, [resumeContentRef, checkConfiguration, checkGrammar, t]);



  return (
    <>
      <div className="hidden md:flex flex-col items-center fixed top-1/2 right-3 transform -translate-y-1/2 z-[50]">
        <TooltipProvider delayDuration={0}>
          <Dock className="bg-background/80 border border-border/40 shadow-xl mb-0">
            <div className="flex flex-col gap-2">
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg",
                        "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
                      )}
                    >
                      <TemplateSheet />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10}>
                    <p>{t("switchTemplate")}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg",
                        "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50",
                        "transition-all duration-200",
                        isChecking && "animate-pulse"
                      )}
                      onClick={handleGrammarCheck}
                    >
                      <SpellCheck2
                        className={cn("h-4 w-4", isChecking && "animate-spin")}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10}>
                    <p>
                      {isChecking
                        ? t("grammarCheck.checking")
                        : t("grammarCheck.idle")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>


              <div className="w-full h-[1px] bg-gray-200" />


            </div>
          </Dock>
        </TooltipProvider>


      </div>
    </>
  );
};

export default PreviewDock;

