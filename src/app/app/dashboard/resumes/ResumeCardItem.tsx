"use client";

import ResumeTemplateComponent from "@/components/templates";
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { DEFAULT_TEMPLATES } from "@/config";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { normalizeFontFamily } from "@/utils/fonts";
import { motion } from "framer-motion";
import React, { useCallback } from "react";
import { toast } from "sonner";
import { ResumeCardActions } from "./ResumeCardActions";

interface ResumeCardItemProps {
    id: string;
    resume: any;
    t: any;
    locale: string;
    router: any;
    index: number;
}

export const ResumeCardItem = ({
    id,
    resume,
    t,
    locale,
    router,
    index,
}: ResumeCardItemProps) => {
    const { duplicateResume, setActiveResume, activeResumeId, deleteResume } = useResumeStore();

    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scale, setScale] = React.useState(0.24);
    const activeTemplate =
        DEFAULT_TEMPLATES.find((template) => template.id === resume.templateId) ??
        DEFAULT_TEMPLATES[0];
    const templateNameKey =
        activeTemplate.id === "left-right" ? "leftRight" : activeTemplate.id;

    React.useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const { width } = entries[0].contentRect;
            if (width > 0) {
                setScale(width / 793.700787); // Exact 210mm in pixels at 96dpi
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const handleCopyResume = useCallback(() => {
        if (!activeResumeId) return;
        try {
            const newId = duplicateResume(activeResumeId);
            const targetPath = `/app/workbench/${newId}`;
            setActiveResume(newId);
            toast.success(t("copyResume.success"));
            router.push(targetPath);

            requestAnimationFrame(() => {
                if (window.location.pathname !== targetPath) {
                    window.location.assign(targetPath);
                }
            });
        } catch (error) {
            toast.error(t("copyResume.error"));
        }
    }, [activeResumeId, duplicateResume, router, setActiveResume, t]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
                duration: 0.3,
                delay: index * 0.1,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <Card
                className={cn(
                    "group border transition-all duration-200 aspect-[210/297] flex flex-col overflow-hidden",
                    "hover:border-primary/40 hover:shadow-lg",
                    "dark:hover:border-primary/40"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    setActiveResume(id);
                    router.push(`/app/workbench/${id}`);
                }}
            >
                <CardContent className="p-0 flex-1 relative bg-gray-50 dark:bg-gray-900 overflow-hidden cursor-pointer">
                    <div className="absolute inset-0 pb-6 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-[1.02] overflow-hidden" ref={containerRef}>
                        <div className="w-full h-full relative origin-top bg-white">
                            <div
                                className="absolute top-0 left-0 bg-white"
                                style={{
                                    width: "210mm",
                                    height: "297mm",
                                    transform: `scale(${scale})`,
                                    transformOrigin: "top left",
                                    padding: `${resume.globalSettings?.pagePadding || 32}px`,
                                    fontFamily: normalizeFontFamily(resume.globalSettings?.fontFamily),
                                }}
                            >
                                <ResumeTemplateComponent data={resume as any} template={activeTemplate} />
                            </div>
                        </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 top-[60%] pointer-events-none bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-950 dark:via-gray-950/90 z-0"></div>
                    <div className="absolute inset-x-0 bottom-0 pt-12 pb-3 px-4 flex justify-between items-end border-t border-transparent z-10 transition-colors group-hover:bg-white/50 dark:group-hover:bg-gray-950/50">
                        <div className="flex flex-col w-full">
                            <span className="text-[15px] font-semibold truncate text-gray-900 dark:text-gray-100 drop-shadow-sm w-[90%]">
                                {resume.title || t("dashboard.resumes.untitled")}
                            </span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="relative pt-2 pb-2 px-2 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 z-10 justify-between">
                    <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 font-medium flex-1">
                        <p>{t(`dashboard.templates.${templateNameKey}.name`)}</p>
                        <p>{new Intl.DateTimeFormat(locale, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        }).format(new Date(resume.createdAt))}</p>
                    </div>

                    <ResumeCardActions
                        onCopy={handleCopyResume}
                        onDelete={() => deleteResume(resume)}
                        t={t}
                    />
                </CardFooter>
            </Card>
        </motion.div>
    );
};
