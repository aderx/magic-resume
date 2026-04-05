"use client";


import { EditorHeader } from "@/components/editor/EditorHeader";
import { EditPanel } from "@/components/editor/EditPanel";
import { SidePanel } from "@/components/editor/SidePanel";
import { MobileWorkbench } from "@/components/mobile/MobileWorkbench";
import PreviewPanel from "@/components/preview";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { Edit2, Eye, Loader2, Minimize2, PanelLeft } from "lucide-react";
import { useParams } from "next/navigation";
import React, { memo, useEffect, useState } from "react";

const LAYOUT_CONFIG = {
  DEFAULT: [20, 32, 48],
  SIDE_COLLAPSED: [50, 50],
  EDIT_FOCUSED: [20, 80],
  PREVIEW_FOCUSED: [20, 80],
};

const PANEL_COLLAPSE_SESSION_KEY = "workbench-panel-collapse-state";

type PanelCollapseState = {
  sidePanelCollapsed: boolean;
  editPanelCollapsed: boolean;
  previewPanelCollapsed: boolean;
};

const DEFAULT_PANEL_COLLAPSE_STATE: PanelCollapseState = {
  sidePanelCollapsed: false,
  editPanelCollapsed: false,
  previewPanelCollapsed: false,
};

type ResumeStorePersistApi = {
  hasHydrated?: () => boolean;
  onFinishHydration?: (listener: () => void) => () => void;
};

const resumeStoreWithPersist = useResumeStore as typeof useResumeStore & {
  persist?: ResumeStorePersistApi;
};

function readPanelCollapseState(): PanelCollapseState {
  if (typeof window === "undefined") {
    return DEFAULT_PANEL_COLLAPSE_STATE;
  }

  const rawState = window.sessionStorage.getItem(PANEL_COLLAPSE_SESSION_KEY);
  if (!rawState) {
    return DEFAULT_PANEL_COLLAPSE_STATE;
  }

  try {
    const parsedState = JSON.parse(rawState);

    return {
      sidePanelCollapsed: Boolean(parsedState?.sidePanelCollapsed),
      editPanelCollapsed: Boolean(parsedState?.editPanelCollapsed),
      previewPanelCollapsed: Boolean(parsedState?.previewPanelCollapsed),
    };
  } catch {
    return DEFAULT_PANEL_COLLAPSE_STATE;
  }
}

const DragHandle = ({ show = true }) => {
  if (!show) return null;

  return (
    <ResizableHandle className="relative w-1.5 group">
      <div
        className={cn(
          "absolute inset-y-0 left-1/2 w-1 -translate-x-1/2",
          "group-hover:bg-primary/20 group-data-[dragging=true]:bg-primary",
          "bg-border"
        )}
      />
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-4 h-8 rounded-full opacity-0 group-hover:opacity-100",
          "flex items-center justify-center",
          "bg-background border border-border"
        )}
      >
        <div className="w-0.5 h-4 bg-muted-foreground/50 rounded-full" />
      </div>
    </ResizableHandle>
  );
};

const LayoutControls = memo(
  ({
    sidePanelCollapsed,
    editPanelCollapsed,
    previewPanelCollapsed,
    toggleSidePanel,
    toggleEditPanel,
    togglePreviewPanel,
  }: {
    sidePanelCollapsed: boolean;
    editPanelCollapsed: boolean;
    previewPanelCollapsed: boolean;
    toggleSidePanel: () => void;
    toggleEditPanel: () => void;
    togglePreviewPanel: () => void;
  }) => (
    <div
      className={cn(
        "absolute bottom-6 left-1/2 -translate-x-1/2",
        "flex items-center gap-2 z-10 p-2 rounded-full",
        "flex items-center gap-2 z-10 p-2 rounded-full",
        "bg-background/80 border border-border",
        "backdrop-blur-sm shadow-lg"
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={sidePanelCollapsed ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={toggleSidePanel}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {sidePanelCollapsed ? "展开侧边栏" : "收起侧边栏"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className={cn("h-5 w-px mx-1", "bg-border")} />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editPanelCollapsed ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={toggleEditPanel}
            >
              {editPanelCollapsed ? (
                <Edit2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {editPanelCollapsed ? "展开编辑面板" : "收起编辑面板"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={previewPanelCollapsed ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={togglePreviewPanel}
            >
              {previewPanelCollapsed ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {previewPanelCollapsed ? "展开预览面板" : "收起预览面板"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
);

LayoutControls.displayName = "LayoutControls";

function WorkbenchLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-gray-900" />
        <p className="text-sm text-gray-500">正在加载，请稍候...</p>
      </div>
    </div>
  );
}

export default function Home() {
  const params = useParams<{ id?: string | string[] }>();
  const resumeId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { resumes, activeResume, activeResumeId, setActiveResume } = useResumeStore();
  const [panelCollapseState, setPanelCollapseState] =
    useState<PanelCollapseState>(DEFAULT_PANEL_COLLAPSE_STATE);
  const [hasLoadedPanelCollapseState, setHasLoadedPanelCollapseState] =
    useState(false);
  const [panelSizes, setPanelSizes] = useState<number[]>(LAYOUT_CONFIG.DEFAULT);
  const [isStoreHydrated, setIsStoreHydrated] = useState<boolean>(() =>
    resumeStoreWithPersist.persist?.hasHydrated?.() ?? true
  );
  const [hasCompletedInitialPaint, setHasCompletedInitialPaint] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const {
    sidePanelCollapsed,
    editPanelCollapsed,
    previewPanelCollapsed,
  } = panelCollapseState;
  const targetResume = resumeId ? resumes[resumeId] : null;
  const isWorkbenchReady =
    Boolean(
      resumeId &&
      targetResume &&
      activeResume?.id === resumeId &&
      isStoreHydrated &&
      hasCompletedInitialPaint &&
      isPreviewReady
    );

  // Create a ref for the resume content that PreviewDock can access
  // Currently we can't get the inner ref easily across component boundaries
  // But we need to pass a mock or implement forwardRef in PreviewPanel later
  // For now we pass null to satisfy the prop requirement
  const resumeContentRef = React.useRef<HTMLDivElement>(null);

  const toggleSidePanel = () => {
    setPanelCollapseState((prevState) => ({
      ...prevState,
      sidePanelCollapsed: !prevState.sidePanelCollapsed,
    }));
  };

  const toggleEditPanel = () => {
    setPanelCollapseState((prevState) => ({
      ...prevState,
      editPanelCollapsed: !prevState.editPanelCollapsed,
    }));
  };

  const togglePreviewPanel = () => {
    setPanelCollapseState((prevState) => ({
      ...prevState,
      previewPanelCollapsed: !prevState.previewPanelCollapsed,
    }));
  };

  const updateLayout = (sizes: number[]) => {
    setPanelSizes(sizes);
  };

  useEffect(() => {
    setPanelCollapseState(readPanelCollapseState());
    setHasLoadedPanelCollapseState(true);
  }, []);

  useEffect(() => {
    const persistApi = resumeStoreWithPersist.persist;
    if (!persistApi) return;

    setIsStoreHydrated(persistApi.hasHydrated?.() ?? true);

    const unsubscribe = persistApi.onFinishHydration?.(() => {
      setIsStoreHydrated(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    setHasCompletedInitialPaint(false);
    setIsPreviewReady(false);
  }, [resumeId]);

  useEffect(() => {
    if (!isStoreHydrated || !resumeId || !targetResume) {
      return;
    }

    if (activeResumeId !== resumeId) {
      setActiveResume(resumeId);
    }
  }, [isStoreHydrated, resumeId, targetResume, activeResumeId, setActiveResume]);

  useEffect(() => {
    if (!isStoreHydrated || !resumeId || !targetResume || activeResume?.id !== resumeId) {
      return;
    }

    let frame1 = 0;
    let frame2 = 0;

    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        setHasCompletedInitialPaint(true);
      });
    });

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [isStoreHydrated, resumeId, targetResume, activeResume?.id]);

  useEffect(() => {
    if (!hasLoadedPanelCollapseState) return;

    window.sessionStorage.setItem(
      PANEL_COLLAPSE_SESSION_KEY,
      JSON.stringify(panelCollapseState)
    );
  }, [hasLoadedPanelCollapseState, panelCollapseState]);

  useEffect(() => {
    document.body.classList.add("workbench-body-lock");
    return () => {
      document.body.classList.remove("workbench-body-lock");
    };
  }, []);

  useEffect(() => {
    let newSizes = [];

    // 侧边栏尺寸
    newSizes.push(sidePanelCollapsed ? 0 : 20);

    // 编辑区尺寸
    if (editPanelCollapsed) {
      newSizes.push(0);
    } else {
      if (sidePanelCollapsed) {
        newSizes.push(36);
      } else {
        if (previewPanelCollapsed) {
          newSizes.push(80);
        } else {
          newSizes.push(32);
        }
      }
    }

    // 预览区尺寸
    if (previewPanelCollapsed) {
      newSizes.push(0);
    } else {
      if (editPanelCollapsed && sidePanelCollapsed) {
        newSizes.push(100);
      } else {
        if (editPanelCollapsed) {
          newSizes.push(80);
        } else {
          // 如果侧边栏收起且编辑区展开，预览区占64，编辑区占36
          if (sidePanelCollapsed) {
            newSizes.push(64);
          } else {
            newSizes.push(48);
          }
        }
      }
    }

    // 确保总和为 100
    const total = newSizes.reduce((a, b) => a + b, 0);
    if (total < 100) {
      const lastNonZeroIndex = newSizes
        .map((size, index) => ({ size, index }))
        .filter(({ size }) => size > 0)
        .pop()?.index;

      if (lastNonZeroIndex !== undefined) {
        newSizes[lastNonZeroIndex] += 100 - total;
      }
    }
    updateLayout([...newSizes]);
  }, [sidePanelCollapsed, editPanelCollapsed, previewPanelCollapsed]);

  return (
    <main
      className={cn(
        "relative w-full min-h-screen overflow-hidden",
        "bg-background text-foreground"
      )}
      aria-busy={!isWorkbenchReady}
    >
      {!isWorkbenchReady && <WorkbenchLoadingOverlay />}
      <EditorHeader sidePanelCollapsed={sidePanelCollapsed}
        editPanelCollapsed={editPanelCollapsed}
        previewPanelCollapsed={previewPanelCollapsed}
        toggleSidePanel={toggleSidePanel}
        toggleEditPanel={toggleEditPanel}
        togglePreviewPanel={togglePreviewPanel} />
      {/* 桌面端布局 */}
      <div className="md:block h-[calc(100vh-64px)] relative flex w-full">
        <div className={cn(
          "h-full transition-all duration-300",
          previewPanelCollapsed ? "w-[calc(100%-4rem)]" : "w-full"
        )}>
          <ResizablePanelGroup
            key={panelSizes?.join("-")}
            direction="horizontal"
            className={cn(
              "h-full",
              "h-full",
              "border border-border bg-background"
            )}
          >
            {/* 侧边栏面板 */}
            {!sidePanelCollapsed && (
              <>
                <ResizablePanel
                  id="side-panel"
                  order={1}
                  defaultSize={panelSizes?.[0]}
                  className={cn(
                    "bg-background border-r border-border"
                  )}
                >
                  <div className="h-full overflow-y-auto">
                    <SidePanel />
                  </div>
                </ResizablePanel>
                <DragHandle />
              </>
            )}

            {/* 编辑面板 */}
            {!editPanelCollapsed && (
              <>
                <ResizablePanel
                  id="edit-panel"
                  order={2}
                  defaultSize={panelSizes?.[1]}
                  className={cn(
                    "bg-background border-r border-border"
                  )}
                >
                  <div className="h-full">
                    <EditPanel />
                  </div>
                </ResizablePanel>
                <DragHandle />
              </>
            )}

            {/* 预览面板 - 使用 CSS 隐藏而非条件渲染，确保导出时 #resume-preview 始终在 DOM 中 */}
            <ResizablePanel
              id="preview-panel"
              order={3}
              collapsible={false}
              defaultSize={panelSizes?.[2]}
              className={cn("bg-gray-100", previewPanelCollapsed && "hidden")}
            >
              <div
                className="h-full overflow-y-auto"
                data-preview-scroll-container="true"
              >
                <PreviewPanel onReady={() => setIsPreviewReady(true)} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* <PreviewDock
          resumeContentRef={resumeContentRef}
        /> */}
      </div>

      {/* 移动端布局 */}
      <div className="md:hidden h-[calc(100vh-64px)]">
        <MobileWorkbench />
      </div>
    </main>
  );
}
