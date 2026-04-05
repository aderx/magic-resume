"use client";

import { useState } from "react";
import { IconResumes, IconTemplates, IconSettings, IconAI } from "@/components/shared/icons/SidebarIcons";
import { usePathname, useRouter } from "@/lib/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import Logo from "@/components/shared/Logo";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  url?: string;
  href?: string;
  icon: any;
  items?: { title: string; href: string }[];
}

function getSidebarActionClass(open: boolean, active = false) {
  return cn(
    "rounded-xl border text-sm font-medium transition-all duration-200 ease-out shrink-0",
    open ? "h-12 w-full justify-start gap-3 px-3" : "size-12 justify-center px-0 self-center",
    active
      ? "border-primary/15 bg-primary/10 text-primary shadow-sm hover:bg-primary/15 hover:text-primary"
      : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-accent/70 hover:text-accent-foreground"
  );
}

function SidebarActionButton({
  open,
  active = false,
  label,
  title,
  icon,
  onClick,
  className,
}: {
  open: boolean;
  active?: boolean;
  label: string;
  title?: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(getSidebarActionClass(open, active), className)}
      onClick={onClick}
      aria-label={label}
      title={title ?? label}
    >
      {icon}
      {open && <span className="text-sm font-medium">{label}</span>}
    </Button>
  );
}

function SidebarToggleButton({ open }: { open: boolean }) {
  const { toggleSidebar } = useSidebar();
  const label = open ? "收起菜单" : "展开菜单";

  return (
    <SidebarActionButton
      open={open}
      label={label}
      icon={<PanelLeft className="size-[18px] shrink-0" />}
      onClick={toggleSidebar}
    />
  );
}

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("dashboard");
  const sidebarItems: MenuItem[] = [
    {
      title: t("sidebar.resumes"),
      url: "/app/dashboard/resumes",
      icon: IconResumes,
    },
    {
      title: t("sidebar.templates"),
      url: "/app/dashboard/templates",
      icon: IconTemplates,
    },
    {
      title: t("sidebar.ai"),
      url: "/app/dashboard/ai",
      icon: IconAI,
    },
    {
      title: t("sidebar.settings"),
      url: "/app/dashboard/settings",
      icon: IconSettings,
    },

  ];

  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(true);
  const [collapsible, setCollapsible] = useState<"offcanvas" | "icon" | "none">(
    "icon"
  );

  const handleItemClick = (item: MenuItem) => {
    if (item.items) {

    } else {
      router.push(item.url || item.href || "/");
    }
  };

  const isItemActive = (item: MenuItem) => {
    if (item.items) {
      return item.items.some((subItem) => pathname === subItem.href);
    }
    return item.url === pathname || item.href === pathname;
  };

  return (
    <div className="flex h-screen bg-background">
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar
          collapsible={collapsible}
          className="border-r border-border/40 bg-card/50 backdrop-blur-xl"
        >
          <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/40">
            <div className="w-full cursor-pointer justify-center flex items-center" onClick={() => router.push(`/${locale}`)}
            >
              <Logo
                className=" hover:opacity-80 transition-opacity"
                size={48}
              />
              {open && (
                <span className="font-bold text-lg tracking-tight">
                  {t("sidebar.appName")}
                </span>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {sidebarItems.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <TooltipProvider delayDuration={0} key={item.title}>
                        <Tooltip>
                          <SidebarMenuItem key={item.title} className={!open ? "justify-center" : undefined}>
                            <TooltipTrigger asChild>
                              <SidebarActionButton
                                open={open}
                                active={active}
                                label={item.title}
                                icon={<item.icon size={24} active={active} />}
                                onClick={() => handleItemClick(item)}
                              />
                            </TooltipTrigger>
                            {item.items && open && (
                              <div className="ml-6 mt-1 space-y-1 border-l border-border/60 pl-4">
                                {item.items.map((subItem) => (
                                  <div
                                    key={subItem.href}
                                    className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${pathname === subItem.href
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                      }`}
                                    onClick={() => router.push(subItem.href)}
                                  >
                                    {subItem.title}
                                  </div>
                                ))}
                              </div>
                            )}
                          </SidebarMenuItem>
                          {!open && (
                            <TooltipContent side="right" className="font-medium">
                              {item.title}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border/40 px-3 py-4">
            <SidebarToggleButton open={open} />
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col">{children}</main>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
