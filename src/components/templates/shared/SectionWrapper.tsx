"use client";

import { motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
    sectionId: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Thin interaction wrapper for all section components.
 * Provides hover highlight + click-to-select behavior.
 */
const SectionWrapper: React.FC<SectionWrapperProps> = ({
    sectionId,
    children,
    className = "",
    style,
}) => {
    const { setActiveSection } = useResumeStore();

    return (
        <motion.div
            data-resume-section-id={sectionId}
            className={cn(
                "hover:cursor-pointer transition-all duration-300 ease-in-out",
                "hover:bg-accent/50 hover:shadow-md",
                className
            )}
            style={style}
            onClick={() => setActiveSection(sectionId)}
        >
            {children}
        </motion.div>
    );
};

export default SectionWrapper;
