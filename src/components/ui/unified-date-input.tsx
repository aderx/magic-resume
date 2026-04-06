"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UnifiedDateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  className?: string;
  disabled?: boolean;
}

type ParsedMonthValue = {
  year: number;
  month: number;
};

const MONTH_VALUES = Array.from({ length: 12 }, (_, index) => index + 1);
const PRESENT_VALUES = new Set(["至今", "Present", "Now"]);

function parseMonthValue(input: string): ParsedMonthValue | null {
  if (!input) return null;

  const normalized = input.trim();
  if (!normalized || PRESENT_VALUES.has(normalized)) {
    return null;
  }

  const match = normalized.match(/^(\d{4})(?:[./-](\d{1,2})(?:[./-]\d{1,2})?)?$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2] || "1");
  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

function formatMonthValue(value: ParsedMonthValue | null) {
  if (!value) return "";
  return `${value.year}/${value.month.toString().padStart(2, "0")}`;
}

function buildYearOptions(selectedYear?: number) {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 100;
  const endYear = currentYear + 20;
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => endYear - index
  );

  if (selectedYear && !years.includes(selectedYear)) {
    years.push(selectedYear);
    years.sort((a, b) => b - a);
  }

  return years;
}

export function UnifiedDateInput({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
}: UnifiedDateInputProps) {
  const t = useTranslations();
  const parsedValue = useMemo(() => parseMonthValue(value), [value]);
  const isPresent = useMemo(
    () => PRESENT_VALUES.has(value.trim()) || value.includes("Present") || value.includes("至今"),
    [value]
  );
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(
    parsedValue?.year || new Date().getFullYear()
  );

  const yearOptions = useMemo(() => buildYearOptions(parsedValue?.year), [parsedValue?.year]);

  const buttonLabel = parsedValue
    ? formatMonthValue(parsedValue)
    : value || placeholder || t("field.selectDate");

  const handleSelectMonth = (month: number) => {
    onChange(formatMonthValue({ year: viewYear, month }));
    setOpen(false);
  };

  return (
    <div className={className}>
      <Popover
        open={isPresent || disabled ? false : open}
        onOpenChange={(nextOpen) => {
          if (!isPresent && !disabled) {
            setOpen(nextOpen);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={isPresent || disabled}
            className={cn(
              "w-full justify-between h-10 px-3 font-normal",
              !parsedValue && !value && "text-muted-foreground",
              (isPresent || disabled) && "opacity-50",
              "shadow-sm"
            )}
          >
            <span>{buttonLabel}</span>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-3" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewYear((year) => year - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select
                value={String(viewYear)}
                onValueChange={(nextYear) => setViewYear(Number(nextYear))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewYear((year) => year + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MONTH_VALUES.map((month) => {
                const isSelected =
                  parsedValue?.year === viewYear && parsedValue.month === month;

                return (
                  <Button
                    key={month}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className="h-9"
                    onClick={() => handleSelectMonth(month)}
                  >
                    {month.toString().padStart(2, "0")}
                  </Button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                {t("field.clear")}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
