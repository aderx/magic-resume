"use client";

import { useMemo } from "react";
import { useTranslations } from "@/i18n/compat/client";
import { cn } from "@/lib/utils";
import { UnifiedDateInput } from "./unified-date-input";

interface UnifiedDateRangeInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const SEPARATOR = " - ";

function parseRangeValue(rangeValue: string) {
  if (!rangeValue) {
    return { start: "", end: "" };
  }

  if (rangeValue.includes(SEPARATOR)) {
    const [start = "", end = ""] = rangeValue.split(SEPARATOR);
    return { start: start.trim(), end: end.trim() };
  }

  const match = rangeValue.match(/^(.+?)\s*(?:-|–|—)\s*(.+)$/);
  if (match) {
    return {
      start: match[1].trim(),
      end: match[2].trim(),
    };
  }

  return { start: rangeValue.trim(), end: "" };
}

export function UnifiedDateRangeInput({
  value,
  onChange,
  className,
}: UnifiedDateRangeInputProps) {
  const t = useTranslations();
  const { start, end } = useMemo(() => parseRangeValue(value), [value]);
  const isPresent = end === t("field.toPresent");
  const hasStart = Boolean(start);

  const updateValue = (nextStart: string, nextEnd: string) => {
    const normalizedStart = nextStart.trim();
    const normalizedEnd = nextEnd.trim();

    if (!normalizedStart) {
      onChange("");
      return;
    }

    if (!normalizedEnd) {
      onChange(`${normalizedStart}${SEPARATOR}`);
      return;
    }

    onChange(`${normalizedStart}${SEPARATOR}${normalizedEnd}`);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2">
        <UnifiedDateInput
          value={start}
          onChange={(nextStart) => updateValue(nextStart, end)}
          placeholder={t("field.startDatePlaceholder")}
          className="flex-1"
        />
        <span className="text-muted-foreground">-</span>
        <UnifiedDateInput
          value={isPresent ? "" : end}
          onChange={(nextEnd) => updateValue(start, nextEnd)}
          placeholder={t("field.endDatePlaceholder")}
          className={cn("flex-1", (!hasStart || isPresent) && "opacity-50")}
          disabled={!hasStart || isPresent}
        />
      </div>
    </div>
  );
}
