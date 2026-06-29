import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  // Payment Statuses
  outstanding: {
    label: "Outstanding",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  partial: {
    label: "Partial",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  reconciled: {
    label: "Reconciled",
    className: "bg-success/10 text-success border-success/20",
  },
  // Event Statuses
  upcoming: {
    label: "Upcoming",
    className: "bg-info/10 text-info border-info/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  completed: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border shadow-none",
  },
  // Quote Statuses
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
  },
  sent: {
    label: "Sent",
    className: "bg-info/10 text-info border-info/20",
  },
  accepted: {
    label: "Accepted",
    className: "bg-success/10 text-success border-success/20",
  },
  declined: {
    label: "Declined",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  // Item / allocation Statuses
  available: {
    label: "Available",
    className: "bg-success/10 text-success border-success/20",
  },
  damaged: {
    label: "Damaged",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  retired: {
    label: "Retired",
    className: "bg-muted text-muted-foreground border-border",
  },
  returned: {
    label: "Returned",
    className: "bg-success/10 text-success border-success/20",
  },
  allocated: {
    label: "Allocated",
    className: "bg-info/10 text-info border-info/20",
  },
  out: {
    label: "Out",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  // General
  active: {
    label: "Active",
    className: "bg-success/10 text-success border-success/20",
  },
  inactive: {
    label: "Inactive",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border transition-colors",
        config.className
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className={cn(
          "h-1 w-1 rounded-full",
          config.className.includes("text-destructive") ? "bg-destructive" :
          config.className.includes("text-success") ? "bg-success" :
          config.className.includes("text-warning") ? "bg-warning" :
          config.className.includes("text-info") ? "bg-info" : "bg-muted-foreground"
        )} />
        {config.label}
      </span>
    </Badge>
  );
}
