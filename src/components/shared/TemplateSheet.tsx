"use client";

import { useEffect, useRef, useState } from "react";
import { Layout } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "@/i18n/compat/client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { DEFAULT_TEMPLATES } from "@/config";
import { useResumeStore } from "@/store/useResumeStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import ResumeTemplateComponent from "@/components/templates";
import { useLocale } from "@/i18n/compat/client";
import { initialResumeState, initialResumeStateEn } from "@/config/initialResumeData";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

type TemplateItem = (typeof DEFAULT_TEMPLATES)[number];

interface TemplatePreviewProps {
  template: TemplateItem;
  isActive: boolean;
  baseData: typeof initialResumeState;
  onSelect: (templateId: string) => void;
}

interface TemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TemplatePreview = ({
  template,
  isActive,
  baseData,
  onSelect,
}: TemplatePreviewProps) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.18);

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;

    const updateScale = () => {
      const { width } = paper.getBoundingClientRect();
      if (!width) return;
      setScale(Math.min(width / A4_WIDTH_PX, 1));
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(paper);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <button
      key={template.id}
      onClick={() => onSelect(template.id)}
      className={cn(
        "relative group rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-[1.02] text-left",
        isActive
          ? "border-primary dark:border-primary shadow-lg dark:shadow-primary/30"
          : "dark:border-neutral-800 dark:hover:border-neutral-700 border-gray-100 hover:border-gray-200"
      )}
    >
      <div className="relative aspect-[210/297] w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="h-full w-full p-2 transition-all duration-300 group-hover:scale-[1.02] flex items-center justify-center pointer-events-none">
          <div
            ref={paperRef}
            className="relative overflow-hidden bg-white shadow-sm ring-1 ring-gray-200/50 rounded-sm"
            style={{
              width: "min(210px, calc(100% - 8px))",
              aspectRatio: "210 / 297",
            }}
          >
            <div
              className="absolute top-0 left-0 bg-white"
              style={{
                width: `${A4_WIDTH_PX}px`,
                height: `${A4_HEIGHT_PX}px`,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                boxSizing: "border-box",
                padding: `${template.spacing.contentPadding}px`,
                fontFamily: "Alibaba PuHuiTi, sans-serif",
              }}
            >
              <ResumeTemplateComponent
                data={{
                  ...baseData,
                  id: `preview-mock-sheet-${template.id}`,
                  templateId: template.id,
                  globalSettings: {
                    ...baseData.globalSettings,
                    themeColor: template.colorScheme.primary,
                    sectionSpacing: template.spacing.sectionGap,
                    paragraphSpacing: template.spacing.itemGap,
                    pagePadding: template.spacing.contentPadding,
                  },
                  basic: {
                    ...baseData.basic,
                    layout: template.basic.layout,
                  },
                } as any}
                template={template}
              />
            </div>
          </div>
        </div>
      </div>
      {isActive && (
        <motion.div
          layoutId="template-selected"
          className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/40 pointer-events-none z-20"
        >
          <Layout className="w-8 h-8 text-primary shadow-sm" />
        </motion.div>
      )}
    </button>
  );
};

const TemplateSheet = ({ open, onOpenChange }: TemplateSheetProps) => {
  const t = useTranslations("templates");
  const commonT = useTranslations("common");
  const { activeResume, setTemplate } = useResumeStore();
  const currentTemplate =
    DEFAULT_TEMPLATES.find((t) => t.id === activeResume?.templateId) ||
    DEFAULT_TEMPLATES[0];

  const locale = useLocale();
  const baseData = locale === "en" ? initialResumeStateEn : initialResumeState;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="flex h-[85vh] w-[92vw] max-w-[1400px] flex-col gap-0 p-0"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <AlertDialogHeader className="flex-row items-center justify-between space-y-0 border-b px-6 py-4">
          <AlertDialogTitle>{t("switchTemplate")}</AlertDialogTitle>
          <AlertDialogCancel className="mt-0">
            {commonT("cancel")}
          </AlertDialogCancel>
        </AlertDialogHeader>

        <div className="min-h-0 flex-1 px-6 py-4">
          <ScrollArea className="h-full w-full pr-4">
            <div className="grid grid-cols-1 gap-4 pb-8 sm:grid-cols-2 xl:grid-cols-4">
              {DEFAULT_TEMPLATES.map((template) => (
                <TemplatePreview
                  key={template.id}
                  template={template}
                  isActive={template.id === currentTemplate.id}
                  baseData={baseData}
                  onSelect={(templateId) => {
                    setTemplate(templateId);
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TemplateSheet;
