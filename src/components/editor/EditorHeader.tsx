"use client";

import { Input } from "@/components/ui/input";
import { useGrammarCheck } from "@/hooks/useGrammarCheck";
import { useTranslations } from "@/i18n/compat/client";
import { useRouter } from "@/lib/navigation";
import { useResumeStore } from "@/store/useResumeStore";
import { getThemeConfig } from "@/theme/themeConfig";
import { motion } from "framer-motion";
import {
  AlertCircle, Edit2,
  Eye,
  Layout,
  PanelRightClose
} from "lucide-react";
import PdfExport from "../shared/PdfExport";
import ThemeToggle from "../shared/ThemeToggle";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { GrammarCheckDrawer } from "./grammar/GrammarCheckDrawer";

interface EditorHeaderProps {
  isMobile?: boolean;

  sidePanelCollapsed: boolean;
  editPanelCollapsed: boolean;
  previewPanelCollapsed: boolean;
  toggleSidePanel: () => void;
  toggleEditPanel: () => void;
  togglePreviewPanel: () => void;
}

export function EditorHeader(props: EditorHeaderProps) {
  const { isMobile, sidePanelCollapsed, editPanelCollapsed, previewPanelCollapsed, toggleSidePanel, toggleEditPanel, togglePreviewPanel } = props;
  const { activeResume, setActiveSection, updateResumeTitle } =
    useResumeStore();
  const { menuSections = [], activeSection } = activeResume || {};
  const themeConfig = getThemeConfig();
  const { errors, selectError } = useGrammarCheck();
  const router = useRouter();
  const t = useTranslations();
  const visibleSections = menuSections
    ?.filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <motion.header
      className={`h-16 border-b sticky top-0 z-10`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
    >
      <div className="flex items-center justify-between px-6 h-full pr-2">
        <div className="flex items-center space-x-6 scrollbar-hide">
          <motion.div
            className="flex items-center space-x-2 shrink-0 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              router.push("/app/dashboard");
            }}
          >
            <span className="text-lg font-semibold">{t("common.title")}</span>
          </motion.div>


          <ToggleGroup
            variant="outline"
            type="multiple"
            value={[
              !sidePanelCollapsed ? 'slide' : '',
              !editPanelCollapsed ? 'edit' : '',
              !previewPanelCollapsed ? 'preview' : ''
            ]}
          >
            <ToggleGroupItem value="slide" onClick={toggleSidePanel}>
              <Layout />
            </ToggleGroupItem>
            <ToggleGroupItem value="edit" onClick={toggleEditPanel}>
              <Edit2 />
            </ToggleGroupItem>
            <ToggleGroupItem value="preview" onClick={togglePreviewPanel}>
              <Eye />
            </ToggleGroupItem>
          </ToggleGroup>

        </div>

        <div className="flex items-center space-x-3">
          <GrammarCheckDrawer />
          {errors.length > 0 && (
            <div
              className="flex items-center space-x-1 cursor-pointer animate-pulse"
              onClick={() => document.dispatchEvent(new CustomEvent('open-grammar-drawer'))}
            >
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500">
                {t("grammarCheck.found_issues", { count: errors.length })}
              </span>
            </div>
          )}
          <Input
            key={activeResume?.id || "resume-title"}
            defaultValue={activeResume?.title || ""}
            onBlur={(e) => {
              updateResumeTitle(e.target.value || "未命名简历");
            }}
            className="w-60  text-sm hidden md:block"
            placeholder="简历名称"
          />

          <ThemeToggle></ThemeToggle>
          <div className="md:flex items-center ">
            <PdfExport />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
