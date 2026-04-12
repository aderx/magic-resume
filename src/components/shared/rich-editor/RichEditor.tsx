"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { useTranslations } from "@/i18n/compat/client";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Check,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  PaintBucket,
  Highlighter,
  Wand2,
} from "lucide-react";
import Highlight from "@tiptap/extension-highlight";
import { cn } from "@/lib/utils";
import { hasMeaningfulRichTextContent } from "@/lib/richText";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import { BetterSpace } from "./BetterSpace";

import "@/styles/tiptap.scss";

interface RichTextEditorProps {
  content?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onPolish?: () => void;
  editable?: boolean;
  className?: string;
  toolbarClassName?: string;
  editorClassName?: string;
  contentClassName?: string;
}

interface ColorOption {
  label: string;
  value: string;
}

const getColors = (t: any): ColorOption[] => [
  { label: t("colors.black"), value: "#000000" },
  { label: t("colors.darkGray"), value: "#333333" },
  { label: t("colors.gray"), value: "#666666" },
  { label: t("colors.red"), value: "#FF0000" },
  { label: t("colors.orange"), value: "#FF4D00" },
  { label: t("colors.orangeYellow"), value: "#FF9900" },
  { label: t("colors.yellow"), value: "#FFCC00" },
  { label: t("colors.yellowGreen"), value: "#33CC00" },
  { label: t("colors.green"), value: "#00CC00" },
  { label: t("colors.cyan"), value: "#00CCCC" },
  { label: t("colors.lightBlue"), value: "#0066FF" },
  { label: t("colors.blue"), value: "#0000FF" },
  { label: t("colors.purple"), value: "#6600FF" },
  { label: t("colors.magenta"), value: "#CC00FF" },
  { label: t("colors.pink"), value: "#FF00FF" },
];

const getBgColors = getColors;

const ALIGNMENT_OPTIONS = [
  { key: "left", icon: AlignLeft, labelKey: "alignLeft" },
  { key: "center", icon: AlignCenter, labelKey: "alignCenter" },
  { key: "right", icon: AlignRight, labelKey: "alignRight" },
  { key: "justify", icon: AlignJustify, labelKey: "alignJustify" },
] as const;

interface MenuButtonProps {
  onClick: (e: React.MouseEvent) => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}

const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  className = "",
  tooltip,
}: MenuButtonProps) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Button
        onMouseDown={(e) => e.preventDefault()}
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "h-8 w-8 rounded-md p-0 transition-all duration-200 hover:scale-105",
          isActive
            ? "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            : "hover:bg-primary/5 dark:hover:bg-neutral-800",
          disabled ? "opacity-50" : "",
          className
        )}
        onClick={handleClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </Button>
      {tooltip && showTooltip && (
        <div
          className={cn(
            "absolute -bottom-8 left-1/2 transform -translate-x-1/2",
            "px-2 py-1 text-xs rounded-md whitespace-nowrap z-50",
            "transition-opacity duration-200",
            "bg-secondary text-secondary-foreground dark:bg-neutral-800 dark:text-neutral-200"
          )}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
};

interface EditorControlButtonProps {
  editor: ReturnType<typeof useEditor>;
  disabled?: boolean;
}

const ColorMenuButton = ({
  editor,
  disabled = false,
}: EditorControlButtonProps) => {
  const [activeColor, setActiveColor] = React.useState<string | null>(null);
  const [activeBgColor, setActiveBgColor] = React.useState<string | null>(null);
  const t = useTranslations("richEditor");
  const colors = getColors(t);
  const bgColors = getBgColors(t);

  React.useEffect(() => {
    const color = editor?.getAttributes("textStyle").color;
    setActiveColor(color);

    const highlight =
      editor?.getAttributes("highlight").color ||
      editor?.getAttributes("highlight");
    setActiveBgColor(typeof highlight === "string" ? highlight : null);
  }, [editor]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 rounded-md p-0 transition-all duration-200 hover:scale-105 hover:bg-primary/5"
          disabled={disabled}
        >
          <PaintBucket
            className="h-5 w-5"
            style={{
              color: activeColor || activeBgColor || "currentColor",
              filter: activeColor || activeBgColor
                ? "drop-shadow(0 1px 1px rgba(0,0,0,0.1))"
                : "none",
            }}
          />
          {(activeColor || activeBgColor) && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background"
              style={{ backgroundColor: activeBgColor || activeColor || "#000000" }}
            />
          )}
          <span className="sr-only">{t("colorSettings")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-lg p-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Highlighter className="h-4 w-4" />
            <span className="text-sm font-medium">{t("textColor")}</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            <button
              className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted"
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setActiveColor(null);
              }}
              disabled={disabled}
            >
              <span className="text-xl leading-none text-muted-foreground">
                /
              </span>
            </button>
            {colors.map((color: ColorOption) => (
              <button
                key={color.value}
                className={`h-8 w-8 rounded-md border hover:scale-110 transition-transform relative
                  ${
                    activeColor === color.value
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  }`}
                style={{
                  backgroundColor: color.value,
                  borderColor:
                    color.value === "#FFFFFF" ? "#E2E8F0" : color.value,
                }}
                onClick={() => {
                  editor.chain().focus().setColor(color.value).run();
                  setActiveColor(color.value);
                }}
                disabled={disabled}
                title={color.label}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <PaintBucket className="h-4 w-4" />
            <span className="text-sm font-medium">{t("backgroundColor")}</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            <button
              className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted"
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                setActiveBgColor(null);
              }}
              disabled={disabled}
            >
              <span className="text-xl leading-none text-muted-foreground">
                /
              </span>
            </button>
            {bgColors.map((color: ColorOption) => (
              <button
                key={color.value}
                className={`h-8 w-8 rounded-md border hover:scale-110 transition-transform relative
                  ${
                    activeBgColor === color.value
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  }`}
                style={{
                  backgroundColor: color.value,
                  borderColor: "transparent",
                }}
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .setHighlight({ color: color.value })
                    .run();
                  setActiveBgColor(color.value);
                }}
                disabled={disabled}
                title={color.label}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const AlignMenuButton = ({
  editor,
  disabled = false,
}: EditorControlButtonProps) => {
  const t = useTranslations("richEditor");
  const currentAlignment =
    (editor?.isActive({ textAlign: "center" }) && "center") ||
    (editor?.isActive({ textAlign: "right" }) && "right") ||
    (editor?.isActive({ textAlign: "justify" }) && "justify") ||
    "left";
  const activeOption =
    ALIGNMENT_OPTIONS.find((option) => option.key === currentAlignment) ||
    ALIGNMENT_OPTIONS[0];
  const ActiveIcon = activeOption.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-md p-0 transition-all duration-200 hover:scale-105 hover:bg-primary/5"
          disabled={disabled}
        >
          <ActiveIcon className="h-5 w-5" />
          <span className="sr-only">{t("textAlign")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1.5">
        <div className="flex flex-col gap-1">
          {ALIGNMENT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = currentAlignment === option.key;

            return (
              <Button
                key={option.key}
                type="button"
                variant="ghost"
                className={cn(
                  "h-9 justify-start px-2 text-sm",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
                disabled={disabled}
                onClick={() => editor.chain().focus().setTextAlign(option.key).run()}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{t(option.labelKey)}</span>
                {isActive && <Check className="ml-auto h-4 w-4" />}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const RichTextEditor = ({
  content = "",
  onChange,
  placeholder,
  onPolish,
  editable = true,
  className,
  toolbarClassName,
  editorClassName,
  contentClassName,
}: RichTextEditorProps) => {
  const t = useTranslations("richEditor");
  const [isEditorEmpty, setIsEditorEmpty] = useState(
    !hasMeaningfulRichTextContent(content)
  );
  const effectivePlaceholder = placeholder || t("empty");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "custom-list",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "custom-list-ordered",
        },
      }),
      ListItem,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      TextStyle,
      Underline,
      Color,
      Highlight.configure({ multicolor: true }),
      BetterSpace,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      setIsEditorEmpty(editor.isEmpty);
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[150px] px-4 py-3",
          "dark:prose-invert",
          "dark:prose-headings:text-neutral-200",
          "dark:prose-p:text-neutral-300",
          "dark:prose-strong:text-neutral-200",
          "dark:prose-em:text-neutral-200",
          "dark:prose-blockquote:text-neutral-300",
          "dark:prose-blockquote:border-neutral-700",
          "dark:prose-ul:text-neutral-300",
          "dark:prose-ol:text-neutral-300",
          editorClassName
        ),
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setIsEditorEmpty(editor.isEmpty);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col rounded-lg overflow-hidden border shadow-sm",
        "bg-card border-gray-100 dark:bg-neutral-900/30 dark:border-neutral-800",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          "sticky top-0 z-20 flex shrink-0 flex-wrap items-center gap-2 border-b px-1.5 py-1.5",
          "bg-background dark:bg-neutral-900/50 dark:border-neutral-800",
          toolbarClassName
        )}
      >
        <div className="flex items-center gap-0.5">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            disabled={!editable}
            tooltip={t("bold")}
          >
            <Bold className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            disabled={!editable}
            tooltip={t("italic")}
          >
            <Italic className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            disabled={!editable}
            tooltip={t("underline")}
          >
            <UnderlineIcon className="h-5 w-5" />
          </MenuButton>
          <AlignMenuButton editor={editor} disabled={!editable} />
          <ColorMenuButton editor={editor} disabled={!editable} />
        </div>

        <div className={cn("h-5 w-px", "bg-border/60 dark:bg-neutral-800")} />

        <div className="flex items-center gap-0.5">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            disabled={!editable}
            tooltip={t("bulletList")}
          >
            <List className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            disabled={!editable}
            tooltip={t("orderedList")}
          >
            <ListOrdered className="h-5 w-5" />
          </MenuButton>
        </div>

        <div className={cn("h-5 w-px", "bg-border/60 dark:bg-neutral-800")} />

        <div className="flex items-center gap-0.5">
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editable || !editor.can().undo()}
            tooltip={t("undo")}
          >
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editable || !editor.can().redo()}
            tooltip={t("redo")}
          >
            <Redo className="h-4 w-4" />
          </MenuButton>
          {onPolish && (
            <>
              <div className={cn("mx-1 h-5 w-px", "bg-border/60 dark:bg-neutral-800")} />
              <MenuButton
                onClick={(e) => {
                  onPolish();
                }}
                disabled={!editable}
                className="text-primary hover:bg-primary/5"
                tooltip={t("aiPolish")}
              >
                <Wand2 className="h-4 w-4" />
              </MenuButton>
            </>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {isEditorEmpty && (
          <div className="pointer-events-none absolute left-4 top-3 z-10 text-sm text-muted-foreground/70">
            {effectivePlaceholder}
          </div>
        )}
        <EditorContent
          editor={editor}
          className={cn(
            "min-h-0 flex-1 overflow-hidden [&_.tiptap]:h-full [&_.tiptap]:min-h-0 [&_.tiptap]:overflow-y-auto [&_.tiptap]:overflow-x-hidden",
            contentClassName
          )}
        />
      </div>

      {/* Bubble Menu */}
      {/* {editor && (
        <BubbleMenu
          className={cn(
            "flex items-center gap-0.5 p-1 rounded-md backdrop-blur border shadow-lg",
            theme === "dark"
              ? "bg-neutral-900/80 border-neutral-800"
              : "bg-background/80 border-gray-100"
          )}
          tippyOptions={{ duration: 100 }}
          editor={editor}
        >
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
          >
            <Bold className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
          >
            <Italic className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
          >
            <UnderlineIcon className="h-5 w-5" />
          </MenuButton>
          <TextColorButton editor={editor} />
          <BackgroundColorButton editor={editor} />
        </BubbleMenu>
      )} */}
    </div>
  );
};

export default RichTextEditor;
