"use client";

import TemplateSheet from "@/components/shared/TemplateSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/i18n/compat/client";
import { cn } from "@/lib/utils";
import { Copy, EllipsisVertical, PanelsLeftBottom, Trash2 } from "lucide-react";
import React from "react";
import { ResumeDeleteDialog } from "./ResumeDeleteDialog";

interface ResumeCardActionsProps {
  onCopy: () => void;
  onDelete: () => void;
  t: any;
}

export function ResumeCardActions({
  onCopy,
  onDelete,
  t,
}: ResumeCardActionsProps) {
  const templateT = useTranslations("templates");
  const [templateDialogOpen, setTemplateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className={cn(
              "flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg",
              "transition-all duration-200",
              "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
            )}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <EllipsisVertical className="h-4 w-4" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onSelect={() => setTemplateDialogOpen(true)}
          >
            <PanelsLeftBottom className="h-4 w-4" />
            {templateT("switchTemplate")}
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer" onClick={onCopy}>
            <Copy className="h-4 w-4" />
            {t("common.copy")}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-500"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onSelect={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TemplateSheet
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
      />

      <ResumeDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={onDelete}
        t={t}
      />
    </>
  );
}
