"use client";

import React, { useState } from "react";
import { useTranslations } from "@/i18n/compat/client";
import {
  Download,
  Loader2,
  FileJson,
  Printer,
  ChevronDown,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { exportToPdf } from "@/utils/export";
import { exportToImage } from "@/utils/export-image";
import { exportResumeToBrowserPrint } from "@/utils/print";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const PdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingMd, setIsExportingMd] = useState(false);
  const { activeResume } = useResumeStore();
  const { globalSettings = {}, title } = activeResume || {};
  const t = useTranslations("pdfExport");

  const handleExport = async () => {
    await exportToPdf({
      elementId: "resume-preview",
      title: title || "resume",
      pagePadding: globalSettings?.pagePadding || 0,
      fontFamily: globalSettings?.fontFamily,
      onStart: () => setIsExporting(true),
      onEnd: () => setIsExporting(false),
      successMessage: t("toast.success"),
      errorMessage: t("toast.error")
    });
  };

  const handleJsonExport = () => {
    try {
      setIsExportingJson(true);
      if (!activeResume) {
        throw new Error("No active resume");
      }

      const jsonStr = JSON.stringify(activeResume, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title}.json`;
      link.click();

      window.URL.revokeObjectURL(url);
      toast.success(t("toast.jsonSuccess"));
    } catch (error) {
      console.error("JSON export error:", error);
      toast.error(t("toast.jsonError"));
    } finally {
      setIsExportingJson(false);
    }
  };

  const handlePrint = async () => {
    const resumeContent = document.getElementById("resume-preview");
    if (!resumeContent) {
      console.error("Resume content not found");
      return;
    }

    const pagePadding = globalSettings?.pagePadding || 0;
    await exportResumeToBrowserPrint(
      resumeContent,
      pagePadding,
      globalSettings?.fontFamily
    );
  };

  const handleImageExport = async () => {
    await exportToImage({
      elementId: "resume-preview",
      title: title || "resume",
      fontFamily: globalSettings?.fontFamily,
      onStart: () => setIsExportingImage(true),
      onEnd: () => setIsExportingImage(false),
      successMessage: t("toast.imageSuccess"),
      errorMessage: t("toast.imageError"),
    });
  };

  const handleMdExport = async () => {
    try {
      setIsExportingMd(true);
      if (!activeResume) {
        throw new Error("No active resume");
      }

      const { resumeToMarkdown } = await import("@/utils/resumeMarkdown");
      const markdown = resumeToMarkdown(activeResume);
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title || "resume"}.md`;
      link.click();

      window.URL.revokeObjectURL(url);
      toast.success(t("toast.mdSuccess"));
    } catch (error) {
      console.error("Markdown export error:", error);
      toast.error(t("toast.mdError"));
    } finally {
      setIsExportingMd(false);
    }
  };

  const isLoading = isExporting || isExportingImage || isExportingJson || isExportingMd;
  const loadingText = isExporting || isExportingImage
    ? t("button.exporting")
    : isExportingJson || isExportingMd
      ? t("button.exportingJson")
      : "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{loadingText}</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{t("button.export")}</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExport} disabled={isLoading}>
          <Download className="w-4 h-4 mr-2" />
          {t("button.exportPdf")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint} disabled={isLoading}>
          <Printer className="w-4 h-4 mr-2" />
          {t("button.print")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleImageExport} disabled={isLoading}>
          <FileText className="w-4 h-4 mr-2" />
          {t("button.exportImage")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleJsonExport} disabled={isLoading}>
          <FileJson className="w-4 h-4 mr-2" />
          {t("button.exportJson")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMdExport} disabled={isLoading}>
          <FileText className="w-4 h-4 mr-2" />
          {t("button.exportMd")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PdfExport;
