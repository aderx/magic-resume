"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Layout, Plus } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { MenuSection } from "@/types/resume";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DEFAULT_TEMPLATES } from "@/config";
import { STANDARD_MODULES } from "@/config/modules";
import LayoutSetting from "./layout/LayoutSetting";

function SettingCard({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("border bg-card border-border shadow-sm")}>
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

export function SidePanel() {
  const {
    activeResume,
    setActiveSection,
    toggleSectionVisibility,
    updateMenuSections,
    reorderSections,
    addCustomData,
  } = useResumeStore();
  const {
    menuSections = [],
    activeSection,
  } = activeResume || {};
  const t = useTranslations("workbench.sidePanel");

  const currentTemplate = DEFAULT_TEMPLATES.find(
    (template) => template.id === activeResume?.templateId
  );

  const availableModules = useMemo(() => {
    return (
      currentTemplate?.availableSections
        ?.map((id) => STANDARD_MODULES[id])
        .filter(Boolean) || []
    );
  }, [currentTemplate]);

  const filteredModules = useMemo(() => {
    const existingIds = new Set(menuSections.map((section: MenuSection) => section.id));
    return availableModules.filter((section) => !existingIds.has(section.id));
  }, [availableModules, menuSections]);

  const generateCustomSectionId = (sections: MenuSection[]) => {
    const customSections = sections.filter((section) =>
      section.id.startsWith("custom")
    );
    return `custom-${customSections.length + 1}`;
  };

  const handleCreateSection = () => {
    const sectionId = generateCustomSectionId(menuSections);
    const newSection = {
      id: sectionId,
      title: sectionId,
      icon: "➕",
      enabled: true,
      order: menuSections.length,
    };

    updateMenuSections([...menuSections, newSection]);
    addCustomData(sectionId);
  };

  return (
    <motion.div
      className={cn("w-[80] border-r overflow-y-auto bg-background border-border")}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <div className="p-4 space-y-4">
        <SettingCard icon={Layout} title={t("layout.title")}>
          <LayoutSetting
            menuSections={menuSections}
            activeSection={activeSection || ""}
            setActiveSection={setActiveSection}
            toggleSectionVisibility={toggleSectionVisibility}
            updateMenuSections={updateMenuSections}
            reorderSections={reorderSections}
          />

          <div className="space-y-2 py-4">
            <Popover>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex justify-center w-full rounded-lg items-center gap-2 py-2 px-3 text-sm font-medium text-primary bg-primary/5 border border-dashed border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t("layout.addCustomSection")}
                </motion.button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-1"
                align="center"
              >
                <div className="flex flex-col gap-1">
                  {filteredModules.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        const newSection = {
                          id: section.id,
                          title: t(`layout.standardSections.${section.titleKey}`),
                          icon: section.icon,
                          enabled: true,
                          order: menuSections.length,
                        };
                        updateMenuSections([...menuSections, newSection]);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
                    >
                      <span className="text-lg">{section.icon}</span>
                      <span>{t(`layout.standardSections.${section.titleKey}`)}</span>
                    </button>
                  ))}

                  {filteredModules.length > 0 && (
                    <div className="h-px bg-border my-1" />
                  )}

                  <button
                    onClick={handleCreateSection}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left text-muted-foreground italic"
                  >
                    <Plus className="w-4 h-4" />
                    {t("layout.addCustomSectionOption")}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </SettingCard>
      </div>
    </motion.div>
  );
}
