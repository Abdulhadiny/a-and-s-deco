"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Boxes,
  CalendarDays,
  Users,
  ReceiptText,
  Wallet,
  PieChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/providers/sidebar-provider";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  permission?: string;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Inventory", href: "/inventory", icon: Boxes, permission: "inventory:read" },
  { title: "Events", href: "/events", icon: CalendarDays, permission: "events:read" },
  { title: "Customers", href: "/customers", icon: Users, permission: "customers:manage" },
  { title: "Quotes", href: "/quotes", icon: ReceiptText, permission: "events:read" },
  { title: "Finance", href: "/finance", icon: Wallet, permission: "finance:read" },
  { title: "Reports", href: "/reports", icon: PieChart, permission: "finance:read" },
  { title: "Settings", href: "/settings", icon: Settings, permission: "settings:manage" },
];

function NavContent({
  items,
  collapsed = false,
  onNavigate,
}: {
  items: NavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col gap-1", collapsed ? "py-6" : "py-4")}>
      {items.map((item) => {
        const isActive = item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(item.href + "/");

        const link = (
          <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center rounded-lg transition-all duration-200 group overflow-hidden shrink-0",
              collapsed
                ? "h-12 w-12 justify-center mx-auto"
                : "w-full h-10 px-3 gap-3",
              isActive
                ? "text-white font-semibold"
                : "text-sidebar-foreground/60 font-medium hover:text-sidebar-foreground hover:bg-white/10"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={collapsed ? "activeNavIndicatorCollapsed" : "activeNavIndicator"}
                className="absolute inset-0 bg-primary -z-10 rounded-lg"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}

            <div className="flex h-5 w-5 shrink-0 items-center justify-center">
              <item.icon className={cn(
                "h-5 w-5 transition-colors duration-200",
                isActive ? "text-white" : "group-hover:text-sidebar-foreground"
              )} />
            </div>

            {!collapsed && (
              <span className="tracking-tight whitespace-nowrap text-sm">
                {item.title}
              </span>
            )}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger>
                {link}
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={12}
                className="bg-card text-foreground border border-border/50 px-3 py-2 rounded-lg text-sm font-medium shadow-md"
              >
                {item.title}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.href}>{link}</div>;
      })}
    </div>
  );
}

export function Sidebar() {
  const { data: session, status } = useSession();
  const { isOpen, isCollapsed, setIsOpen, setIsCollapsed } = useSidebar();

  const isLoading = status === "loading";
  const user = session?.user as any;
  const permissions = user?.permissions || [];
  const role = user?.role;

  const filteredItems = navItems.filter((item) => {
    if (isLoading) return true;
    if (!item.permission || role === "admin") return true;
    return permissions.includes(item.permission);
  });

  return (
    <TooltipProvider>
      {/* Desktop sidebar */}
      <div
        style={{ width: isCollapsed ? 80 : 260 }}
        className="sticky top-0 h-screen hidden md:flex flex-col z-40 bg-zinc-950 border-r border-zinc-800 overflow-hidden transition-[width] duration-200 ease-in-out"
      >
        <div className="flex h-16 items-center px-4 shrink-0">
          <div className={cn(
            "flex items-center overflow-hidden w-full",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <button
              onClick={() => isCollapsed && setIsCollapsed(false)}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-white shadow-sm",
                isCollapsed && "cursor-pointer hover:from-primary hover:to-primary/80 transition-colors"
              )}
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </button>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col whitespace-nowrap flex-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-base font-bold tracking-tight text-white leading-none">A&S Deco</span>
                      <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest mt-1">Management System</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCollapsed(true)}
                      className="h-8 w-8 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors ml-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-3">
          <NavContent items={filteredItems} collapsed={isCollapsed} />
        </ScrollArea>

        <div className="p-4 mt-auto border-t border-zinc-800 shrink-0">
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "w-full justify-start gap-3 rounded-lg h-10 px-3 text-sm font-medium text-white/40 hover:bg-red-500/15 hover:text-red-300 transition-colors",
              isCollapsed && "h-12 w-12 justify-center mx-auto px-0"
            )}
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-zinc-950 border-r border-zinc-800">
          <div className="flex h-16 items-center px-4 shrink-0 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-white leading-none">A&S Decorations</span>
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest mt-1">Management</span>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1 px-3">
            <NavContent
              items={filteredItems}
              onNavigate={() => setIsOpen(false)}
            />
          </ScrollArea>
          <div className="p-4 mt-auto border-t border-zinc-800">
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full justify-start gap-3 rounded-lg h-10 px-3 text-sm font-medium text-white/40 hover:bg-red-500/15 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5 shrink-0" />
              <span>Log Out</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
