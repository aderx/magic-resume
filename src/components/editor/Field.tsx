"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";

import { cn } from "@/lib/utils";
import { hasMeaningfulRichTextContent } from "@/lib/richText";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "../shared/rich-editor/RichEditor";
import AIPolishDialog from "../shared/ai/AIPolishDialog";
import { useAIConfiguration } from "@/hooks/useAIConfiguration";
import { UnifiedDateInput } from "../ui/unified-date-input";
import { UnifiedDateRangeInput } from "../ui/unified-date-range-input";

interface FieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "textarea" | "date" | "editor" | "date-range";
  placeholder?: string;
  required?: boolean;
  className?: string;
  showPresentSwitch?: boolean;
  disabled?: boolean;
  remarkValue?: string;
  onRemarkChange?: (value: string) => void;
  remarkPlaceholder?: string;
}

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  className,
  showPresentSwitch,
  disabled = false,
  remarkValue,
  onRemarkChange,
  remarkPlaceholder,
}: FieldProps) => {
  const [showPolishDialog, setShowPolishDialog] = useState(false);
  const [remarkExpanded, setRemarkExpanded] = useState(false);
  const { checkConfiguration } = useAIConfiguration();
  const t = useTranslations();
  const [rangeStart] = value.split(" - ");

  const isPresentValue = useMemo(() => {
    return value === t("field.toPresent") || value.endsWith(` - ${t("field.toPresent")}`);
  }, [value, t]);
  const presentSwitchDisabled = useMemo(() => {
    if (disabled) {
      return true;
    }

    if (type === "date-range") {
      return !rangeStart.trim();
    }

    return false;
  }, [disabled, type, rangeStart]);
  const hasRemark = useMemo(
    () => hasMeaningfulRichTextContent(remarkValue),
    [remarkValue]
  );

  useEffect(() => {
    if (!onRemarkChange) {
      setRemarkExpanded(false);
    }
  }, [onRemarkChange]);

  const handlePresentToggle = (checked: boolean) => {
    if (presentSwitchDisabled) {
      return;
    }

    if (type === "date") {
      onChange(checked ? t("field.toPresent") : "");
    } else if (type === "date-range") {
      const [start] = value.split(" - ");
      onChange(checked ? `${start || ""} - ${t("field.toPresent")}` : start || "");
    }
  };

  const renderLabel = () => {
    if (!label) return null;
    return (
      <div className="flex items-center justify-between mb-1.5 font-medium">
        <span className="text-sm text-foreground">
          {label}
        </span>
        {showPresentSwitch && (
          <div className="flex items-center gap-2">
            <Switch
              checked={isPresentValue}
              onCheckedChange={handlePresentToggle}
              disabled={presentSwitchDisabled}
            />
            <span className="text-xs text-muted-foreground">
              {t("field.toPresent")}
            </span>
          </div>
        )}
      </div>
    );
  };

  const inputStyles = cn(
    "block w-full rounded-md border-0 py-1.5 px-3",
    "text-foreground bg-background",
    "shadow-sm ring-1 ring-inset ring-input",
    "placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary",
    "sm:text-sm sm:leading-6",
    className
  );

  if (type === "date") {
    return (
      <div className="block">
        {renderLabel()}
        <UnifiedDateInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          isRequired={required}
          className={className}
          disabled={disabled}
        />
      </div>
    );
  }

  if (type === "date-range") {
    return (
      <div className="block">
        {renderLabel()}
        <UnifiedDateRangeInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
        />
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <label className="block">
        {renderLabel()}
        <motion.textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputStyles}
          required={required}
          disabled={disabled}
          rows={4}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        />
      </label>
    );
  }

  if (type === "editor") {
    return (
      <motion.div className="block">
        {renderLabel()}
        <div className="mt-1.5">
          <RichTextEditor
            content={value || ""}
            onChange={onChange}
            placeholder={placeholder}
            onPolish={() => {
              if (checkConfiguration()) {
                setShowPolishDialog(true);
              }
            }}
          />
        </div>

        {onRemarkChange && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between font-medium">
              <span className="flex items-center gap-2 text-sm text-foreground">
                {t("field.remark")}
                {hasRemark && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {t("field.remarkFilled")}
                  </span>
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setRemarkExpanded((prev) => !prev)}
              >
                <ChevronDown
                  className={cn(
                    "mr-1 h-4 w-4 transition-transform",
                    remarkExpanded && "rotate-180"
                  )}
                />
                {remarkExpanded ? t("field.collapse") : t("field.expand")}
              </Button>
            </div>

            <AnimatePresence initial={false}>
              {remarkExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <RichTextEditor
                    content={remarkValue || ""}
                    onChange={onRemarkChange}
                    placeholder={remarkPlaceholder || t("field.remarkPlaceholder")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <AIPolishDialog
          open={showPolishDialog}
          onOpenChange={setShowPolishDialog}
          content={value || ""}
          onApply={(content) => {
            onChange(content);
          }}
        />
      </motion.div>
    );
  }

  return (
    <label className="block">
      {renderLabel()}
      <motion.input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputStyles}
        required={required}
        disabled={disabled}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      />
    </label>
  );
};

export default Field;
