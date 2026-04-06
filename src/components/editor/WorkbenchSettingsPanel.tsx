"use client";

import { useEffect, useMemo, useState } from "react";
import { Monitor, Moon, Palette, Settings2, SpaceIcon, Sun, Type, Zap } from "lucide-react";
import debounce from "lodash/debounce";
import { useTheme } from "next-themes";
import { useTranslations } from "@/i18n/compat/client";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { THEME_COLORS } from "@/types/resume";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "../ui/item";
import { getFontOptions, normalizeFontFamily } from "@/utils/fonts";

function SettingCard({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: any;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("border bg-card border-border shadow-sm")}>
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Icon className={cn("w-4 h-4 text-muted-foreground")} />
          <span className={cn("text-foreground")}>{title}</span>
        </CardTitle>
        {action && <div className="ml-auto">{action}</div>}
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

export function WorkbenchSettingsPanel() {
  const { activeResume, updateGlobalSettings, setThemeColor } = useResumeStore();
  const globalSettings = activeResume?.globalSettings || {};
  const { themeColor = THEME_COLORS[0] } = globalSettings;
  const t = useTranslations("workbench.sidePanel");
  const headerT = useTranslations("workbench.header");
  const fontOptions = getFontOptions((key) => t(`typography.font.${key}`));
  const selectedFontFamily = normalizeFontFamily(globalSettings.fontFamily);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const debouncedSetColor = useMemo(
    () =>
      debounce((value: string) => {
        setThemeColor(value);
      }, 100),
    [setThemeColor]
  );

  useEffect(() => {
    return () => {
      debouncedSetColor.cancel();
    };
  }, [debouncedSetColor]);

  return (
    <div className="space-y-4">
      <SettingCard icon={Settings2} title={headerT("settings.title")}>
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            {headerT("appearance.title")}
          </Label>
          <Select
            value={mounted ? theme ?? "system" : "system"}
            onValueChange={(value) => setTheme(value)}
          >
            <SelectTrigger className="border border-input bg-background transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={cn("bg-popover border-border")}>
              <SelectItem value="light">
                <span className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  {headerT("appearance.light")}
                </span>
              </SelectItem>
              <SelectItem value="dark">
                <span className="flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  {headerT("appearance.dark")}
                </span>
              </SelectItem>
              <SelectItem value="system">
                <span className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  {headerT("appearance.system")}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs leading-5 text-muted-foreground">
            {headerT("appearance.description")}
          </p>
        </div>
      </SettingCard>

      <SettingCard
        icon={Palette}
        title={t("theme.title")}
        action={
          <ColorPicker
            value={themeColor}
            onChange={(value) => debouncedSetColor(value)}
            className={cn(
              "h-7 w-auto px-3 py-0 rounded-full border shadow-none transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
              !THEME_COLORS.includes(themeColor)
                ? "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/60"
                : "border-border text-muted-foreground bg-transparent hover:bg-accent/50 hover:text-foreground"
            )}
            style={{ backgroundColor: "transparent" }}
            title={t("theme.custom")}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{t("theme.custom")}</span>

            {!THEME_COLORS.includes(themeColor) && (
              <div
                className="w-2.5 h-2.5 rounded-full ml-0.5 border border-primary/20 shadow-sm"
                style={{ backgroundColor: themeColor }}
              />
            )}
          </ColorPicker>
        }
      >
        <div className="flex flex-wrap gap-2.5 pt-1">
          {THEME_COLORS.map((presetTheme) => (
            <button
              key={presetTheme}
              className={cn(
                "relative group w-6 h-6 rounded-full overflow-hidden transition-all duration-200 focus:outline-none",
                themeColor === presetTheme
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "ring-1 ring-border hover:ring-primary/50 hover:scale-110"
              )}
              onClick={() => setThemeColor(presetTheme)}
              title={presetTheme}
            >
              <div
                className="absolute inset-0"
                style={{ backgroundColor: presetTheme }}
              />
            </button>
          ))}
        </div>
      </SettingCard>

      <SettingCard icon={Type} title={t("typography.title")}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              {t("typography.font.title")}
            </Label>
            <Select
              value={selectedFontFamily}
              onValueChange={(value) =>
                updateGlobalSettings?.({ fontFamily: value })
              }
            >
              <SelectTrigger className="border border-input bg-background transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn("bg-popover border-border")}>
                {fontOptions.map((font) => (
                  <SelectItem
                    key={font.value}
                    value={font.value}
                    className="cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
                  >
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("typography.font.note")}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">
              {t("typography.lineHeight.title")}
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[globalSettings.lineHeight || 1.5]}
                min={1}
                max={2}
                step={0.1}
                onValueChange={([value]) =>
                  updateGlobalSettings?.({ lineHeight: value })
                }
              />
              <span className="min-w-[3ch] text-sm text-muted-foreground">
                {globalSettings.lineHeight}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">
              {t("typography.baseFontSize.title")}
            </Label>
            <Select
              value={globalSettings.baseFontSize?.toString()}
              onValueChange={(value) =>
                updateGlobalSettings?.({ baseFontSize: parseInt(value) })
              }
            >
              <SelectTrigger className="border border-input bg-background transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn("bg-popover border-border")}>
                {[12, 13, 14, 15, 16, 18, 20, 24].map((size) => (
                  <SelectItem
                    key={size}
                    value={size.toString()}
                    className="cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
                  >
                    {size}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">
              {t("typography.headerSize.title")}
            </Label>
            <Select
              value={globalSettings.headerSize?.toString()}
              onValueChange={(value) =>
                updateGlobalSettings?.({ headerSize: parseInt(value) })
              }
            >
              <SelectTrigger className="border border-input bg-background transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn("bg-popover border-border")}>
                {[12, 13, 14, 15, 16, 18, 20, 24].map((size) => (
                  <SelectItem
                    key={size}
                    value={size.toString()}
                    className="cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
                  >
                    {size}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">
              {t("typography.subheaderSize.title")}
            </Label>
            <Select
              value={globalSettings.subheaderSize?.toString()}
              onValueChange={(value) =>
                updateGlobalSettings?.({ subheaderSize: parseInt(value) })
              }
            >
              <SelectTrigger className="border border-input bg-background transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={cn("bg-popover border-border")}>
                {[12, 13, 14, 15, 16, 18, 20, 24].map((size) => (
                  <SelectItem
                    key={size}
                    value={size.toString()}
                    className="cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
                  >
                    {size}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingCard>

      <SettingCard icon={SpaceIcon} title={t("spacing.title")}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">
              {t("spacing.pagePadding.title")}
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[globalSettings.pagePadding || 0]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) =>
                  updateGlobalSettings?.({ pagePadding: value })
                }
                className="flex-1"
              />
              <div className="flex items-center">
                <div className="flex h-8 w-20 overflow-hidden rounded-md border border-input">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={globalSettings.pagePadding || 0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 100) {
                        updateGlobalSettings?.({ pagePadding: value });
                      }
                    }}
                    className="h-full w-12 border-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0 no-spinner"
                  />
                  <div className="flex flex-col border-l border-input">
                    <button
                      type="button"
                      className="flex h-4 w-8 items-center justify-center border-b border-input bg-transparent text-muted-foreground hover:bg-accent"
                      onClick={() => {
                        const currentValue = globalSettings.pagePadding || 0;
                        if (currentValue < 100) {
                          updateGlobalSettings?.({
                            pagePadding: currentValue + 1,
                          });
                        }
                      }}
                    >
                      <span className="sr-only">增加</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="flex h-4 w-8 items-center justify-center bg-transparent text-muted-foreground hover:bg-accent"
                      onClick={() => {
                        const currentValue = globalSettings.pagePadding || 0;
                        if (currentValue > 0) {
                          updateGlobalSettings?.({
                            pagePadding: currentValue - 1,
                          });
                        }
                      }}
                    >
                      <span className="sr-only">减少</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <span className="ml-1 text-sm text-muted-foreground">px</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">
              {t("spacing.sectionSpacing.title")}
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[globalSettings.sectionSpacing || 0]}
                min={1}
                max={100}
                step={1}
                onValueChange={([value]) =>
                  updateGlobalSettings?.({ sectionSpacing: value })
                }
                className="flex-1"
              />
              <div className="flex items-center">
                <div className="flex h-8 w-20 overflow-hidden rounded-md border border-input">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={globalSettings.sectionSpacing || 0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= 100) {
                        updateGlobalSettings?.({ sectionSpacing: value });
                      }
                    }}
                    className="h-full w-12 border-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0 no-spinner"
                  />
                  <div className="flex flex-col border-l border-input">
                    <button
                      type="button"
                      className="flex h-4 w-8 items-center justify-center border-b border-input bg-transparent text-muted-foreground hover:bg-accent"
                      onClick={() => {
                        const currentValue = globalSettings.sectionSpacing || 0;
                        if (currentValue < 100) {
                          updateGlobalSettings?.({
                            sectionSpacing: currentValue + 1,
                          });
                        }
                      }}
                    >
                      <span className="sr-only">增加</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="flex h-4 w-8 items-center justify-center bg-transparent text-muted-foreground hover:bg-accent"
                      onClick={() => {
                        const currentValue = globalSettings.sectionSpacing || 0;
                        if (currentValue > 1) {
                          updateGlobalSettings?.({
                            sectionSpacing: currentValue - 1,
                          });
                        }
                      }}
                    >
                      <span className="sr-only">减少</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <span className="ml-1 text-sm text-muted-foreground">px</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">
              {t("spacing.paragraphSpacing.title")}
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[globalSettings.paragraphSpacing || 0]}
                min={1}
                max={50}
                step={1}
                onValueChange={([value]) =>
                  updateGlobalSettings?.({ paragraphSpacing: value })
                }
                className="flex-1"
              />
              <div className="flex items-center">
                <div className="flex h-8 w-20 overflow-hidden rounded-md border border-input">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={globalSettings.paragraphSpacing || 0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!isNaN(value) && value >= 1) {
                        updateGlobalSettings?.({ paragraphSpacing: value });
                      }
                    }}
                    className="h-full w-12 border-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0 no-spinner"
                  />
                  <div className="flex flex-col border-l border-input">
                    <button
                      type="button"
                      className="flex h-4 w-8 items-center justify-center border-b border-input bg-transparent text-muted-foreground hover:bg-accent"
                      onClick={() => {
                        const currentValue = globalSettings.paragraphSpacing || 0;
                        if (currentValue < 100) {
                          updateGlobalSettings?.({
                            paragraphSpacing: currentValue + 1,
                          });
                        }
                      }}
                    >
                      <span className="sr-only">增加</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="flex h-4 w-8 items-center justify-center bg-transparent text-muted-foreground hover:bg-accent"
                      onClick={() => {
                        const currentValue = globalSettings.paragraphSpacing || 0;
                        if (currentValue > 1) {
                          updateGlobalSettings?.({
                            paragraphSpacing: currentValue - 1,
                          });
                        }
                      }}
                    >
                      <span className="sr-only">减少</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <span className="ml-1 text-sm text-muted-foreground">px</span>
              </div>
            </div>
          </div>
        </div>
      </SettingCard>

      <SettingCard icon={Zap} title={t("mode.title")}>
        <div className="space-y-3">
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{t("mode.autoOnePage.title")}</ItemTitle>
              <ItemDescription>{t("mode.autoOnePage.description")}</ItemDescription>
            </ItemContent>

            <ItemActions>
              <Switch
                checked={globalSettings.autoOnePage}
                onCheckedChange={(checked) =>
                  updateGlobalSettings({
                    autoOnePage: checked,
                  })
                }
              />
            </ItemActions>
          </Item>

          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{t("mode.useIconMode.title")}</ItemTitle>
              <ItemDescription>{t("mode.useIconMode.description")}</ItemDescription>
            </ItemContent>

            <ItemActions>
              <Switch
                checked={globalSettings.useIconMode}
                onCheckedChange={(checked) =>
                  updateGlobalSettings({
                    useIconMode: checked,
                  })
                }
              />
            </ItemActions>
          </Item>

          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{t("mode.centerSubtitle.title")}</ItemTitle>
              <ItemDescription>{t("mode.centerSubtitle.description")}</ItemDescription>
            </ItemContent>

            <ItemActions>
              <Switch
                checked={globalSettings.centerSubtitle}
                onCheckedChange={(checked) =>
                  updateGlobalSettings({
                    centerSubtitle: checked,
                  })
                }
              />
            </ItemActions>
          </Item>

          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{t("mode.flexibleHeaderLayout.title")}</ItemTitle>
              <ItemDescription>{t("mode.flexibleHeaderLayout.description")}</ItemDescription>
            </ItemContent>

            <ItemActions>
              <Switch
                checked={globalSettings.flexibleHeaderLayout}
                onCheckedChange={(checked) =>
                  updateGlobalSettings({
                    flexibleHeaderLayout: checked,
                  })
                }
              />
            </ItemActions>
          </Item>
        </div>
      </SettingCard>
    </div>
  );
}
