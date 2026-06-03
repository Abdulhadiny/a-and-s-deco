import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  // Payment Statuses
  outstanding: {
    label: "Outstanding",
    className: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
  partial: {
    label: "Partial",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  reconciled: {
    label: "Reconciled",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  // Event Statuses
  upcoming: {
    label: "Upcoming",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  cancelled: { 
    label: "Cancelled", 
    className: "bg-accent text-muted-foreground border-border shadow-none grayscale" 
  },
  // Item Statuses
  available: {
    label: "Available",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  damaged: {
    label: "Damaged",
    className: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
  retired: {
    label: "Retired",
    className: "bg-accent text-muted-foreground border-border",
  },
  // General
  active: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  inactive: {
    label: "Inactive",
    className: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] ?? {
    label: status,
    className: "bg-accent text-muted-foreground border-border",
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
          config.className.includes("text-rose-500") ? "bg-rose-500" :
          config.className.includes("text-emerald-500") ? "bg-emerald-500" :
          config.className.includes("text-amber-500") ? "bg-amber-500" :
          config.className.includes("text-blue-400") ? "bg-blue-400" : "bg-primary"
        )} />
        {config.label}
      </span>
    </Badge>
  );
}
