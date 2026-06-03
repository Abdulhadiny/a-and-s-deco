import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type StatCardColor = "blue" | "green" | "amber" | "rose" | "violet" | "cyan" | "teal";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  color?: StatCardColor;
  tooltip?: string;
  className?: string;
}

const colorStyles: Record<StatCardColor, { card: string; border: string; icon: string; label: string }> = {
  blue: {
    card: "bg-blue-500/5",
    border: "border-blue-500/10",
    icon: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    label: "text-blue-500",
  },
  green: {
    card: "bg-emerald-500/5",
    border: "border-emerald-500/10",
    icon: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    label: "text-emerald-500",
  },
  amber: {
    card: "bg-amber-500/5",
    border: "border-amber-500/10",
    icon: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    label: "text-amber-500",
  },
  rose: {
    card: "bg-rose-500/5",
    border: "border-rose-500/10",
    icon: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    label: "text-rose-500",
  },
  violet: {
    card: "bg-violet-500/5",
    border: "border-violet-500/10",
    icon: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    label: "text-violet-500",
  },
  cyan: {
    card: "bg-cyan-500/5",
    border: "border-cyan-500/10",
    icon: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    label: "text-cyan-500",
  },
  teal: {
    card: "bg-teal-500/5",
    border: "border-teal-500/10",
    icon: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    label: "text-teal-500",
  },
};

export function StatCard({ title, value, icon: Icon, description, trend, color, tooltip, className }: StatCardProps) {
  const cs = color ? colorStyles[color] : null;

  return (
    <div className={cn("h-full", className)}>
      <div className={cn(
        "h-full border rounded-xl p-4 md:p-5 transition-colors",
        cs ? cn(cs.card, cs.border) : "bg-card border-border"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0 flex-1">
            <p className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              cs ? cs.label : "text-muted-foreground"
            )}>
              {title}
            </p>
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground truncate" title={tooltip}>
              {value}
            </h3>
          </div>

          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border shrink-0",
            cs ? cs.icon : "bg-muted text-muted-foreground border-border"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {(description || trend) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {trend && (
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-bold",
                trend.isUp
                  ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                  : "text-rose-500 bg-rose-500/10 border-rose-500/20"
              )}>
                {trend.value}
              </span>
            )}
            {description && (
              <span className="text-xs font-medium text-muted-foreground truncate">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
