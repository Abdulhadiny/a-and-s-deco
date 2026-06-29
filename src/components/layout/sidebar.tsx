"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
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
    <div className={cn("flex flex-col gap-0.5", collapsed ? "py-6" : "py-4")}>
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
                ? "h-11 w-11 justify-center mx-auto"
                : "w-full h-10 px-3 gap-3",
              isActive
                ? "text-sidebar-primary-foreground font-semibold"
                : "text-sidebar-foreground/55 font-medium hover:text-sidebar-foreground hover:bg-white/5"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={collapsed ? "activeNavIndicatorCollapsed" : "activeNavIndicator"}
                className="absolute inset-0 bg-sidebar-primary -z-10 rounded-lg"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}

            <div className="flex h-5 w-5 shrink-0 items-center justify-center">
              <item.icon className={cn(
                "h-[18px] w-[18px] transition-colors duration-200",
                isActive
                  ? "text-sidebar-primary-foreground"
                  : "group-hover:text-sidebar-foreground"
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
              <TooltipTrigger render={link} />
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isLoading = status === "loading";
  const user = session?.user as any;
  const permissions = user?.permissions || [];
  const role = user?.role;

  const filteredItems = navItems.filter((item) => {
    if (isLoading) return true;
    if (!item.permission || role === "admin") return true;
    return permissions.includes(item.permission);
  });

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";
  const roleName = typeof role === "string" ? role : (role?.name ?? "Staff");

  return (
    <TooltipProvider>
      {/* Desktop sidebar */}
      <div
        style={{ width: isCollapsed ? 80 : 260 }}
        className="sticky top-0 h-screen hidden md:flex flex-col z-40 bg-sidebar border-r border-sidebar-border overflow-hidden transition-[width] duration-200 ease-in-out"
      >
        {/* Header */}
        <div className="flex h-16 items-center px-4 shrink-0 border-b border-sidebar-border">
          <div className={cn(
            "flex items-center overflow-hidden w-full",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <button
              onClick={() => isCollapsed && setIsCollapsed(false)}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm",
                isCollapsed && "cursor-pointer hover:bg-sidebar-primary/90 transition-colors"
              )}
            >
              {isCollapsed
                ? <ChevronRight className="h-4 w-4" />
                : <Sparkles className="h-4 w-4" />
              }
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
                      <span className="text-sm font-bold tracking-tight text-sidebar-foreground leading-none">
                        A&S Decorations
                      </span>
                      <span className="text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-widest mt-1">
                        Management System
                      </span>
                    </div>
                    <button
                      onClick={() => setIsCollapsed(true)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors ml-2"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-3">
          <NavContent items={filteredItems} collapsed={isCollapsed} />
        </ScrollArea>

        {/* User footer */}
        <div className="p-3 mt-auto border-t border-sidebar-border shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group cursor-default">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-sidebar-primary text-sm font-semibold">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate leading-none">
                  {user?.name}
                </p>
                <p className="text-[11px] text-sidebar-foreground/40 truncate mt-0.5 capitalize">
                  {roleName}
                </p>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="h-7 w-7 flex items-center justify-center rounded-md text-sidebar-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex h-11 w-11 items-center justify-center rounded-lg mx-auto text-sidebar-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-r border-sidebar-border">
          <div className="flex h-16 items-center px-4 shrink-0 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-sidebar-foreground leading-none">
                  A&S Decorations
                </span>
                <span className="text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-widest mt-1">
                  Management
                </span>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1 px-3">
            <NavContent
              items={filteredItems}
              onNavigate={() => setIsOpen(false)}
            />
          </ScrollArea>
          <div className="p-3 mt-auto border-t border-sidebar-border">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-sidebar-primary text-sm font-semibold">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate leading-none">
                  {user?.name}
                </p>
                <p className="text-[11px] text-sidebar-foreground/40 truncate mt-0.5 capitalize">
                  {roleName}
                </p>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="h-7 w-7 flex items-center justify-center rounded-md text-sidebar-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <ConfirmationDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sign Out"
        description="You will be signed out and redirected to the login page."
        confirmLabel="Yes, Sign Out"
        variant="destructive"
        onConfirm={() => { setShowLogoutConfirm(false); signOut({ callbackUrl: "/login" }); }}
      />
    </TooltipProvider>
  );
}
