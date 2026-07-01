"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Calendar, Package, RotateCcw, CreditCard, FileText, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "@/lib/actions/notifications";
import type { NotificationType } from "@/generated/prisma";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
};

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  EVENT_CREATED: <Calendar className="h-4 w-4 text-primary" />,
  ITEMS_ALLOCATED: <Package className="h-4 w-4 text-amber-500" />,
  ITEMS_RETURNED: <RotateCcw className="h-4 w-4 text-green-500" />,
  PAYMENT_RECEIVED: <CreditCard className="h-4 w-4 text-emerald-500" />,
  QUOTE_UPDATED: <FileText className="h-4 w-4 text-blue-500" />,
};

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30_000,
  });

  const readMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function handleClick(n: Notification) {
    if (!n.isRead) readMutation.mutate(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <Popover>
      <PopoverTrigger render={
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 md:h-10 md:w-10 rounded-xl border border-border hover:bg-muted transition-colors shadow-sm"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      } />
      <PopoverContent
        align="end"
        className="w-80 md:w-96 p-0 rounded-xl shadow-md border-border overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[380px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-border/50 last:border-0",
                  !n.isRead && "bg-primary/5"
                )}
              >
                <div className="mt-0.5 shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-muted border border-border/50">
                  {TYPE_ICON[n.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm leading-snug truncate",
                    n.isRead ? "text-muted-foreground font-normal" : "text-foreground font-medium"
                  )}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {relativeTime(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="mt-2 shrink-0 h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
