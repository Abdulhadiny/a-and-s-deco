import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LucideIcon, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
    href?: string;
  };
  children?: React.ReactNode;
}

export function PageHeader({ title, description, backHref, action, children }: PageHeaderProps) {
  const actionButton = action ? (
    <Button
      onClick={action.onClick}
      className={cn(
        "gap-2 rounded-lg h-10 px-4 shadow-sm transition-all font-semibold text-sm cursor-pointer w-full sm:w-auto",
        "bg-primary hover:bg-primary/90 active:scale-[0.98]"
      )}
    >
      {action.icon && <action.icon className="h-4 w-4" />}
      {action.label}
    </Button>
  ) : null;

  return (
    <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Settings
          </Link>
        )}
        <h1 className="font-heading text-2xl md:text-3xl font-normal tracking-tight text-foreground leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {action && (
          action.href ? (
            <Link href={action.href} className="w-full sm:w-auto">
              {actionButton}
            </Link>
          ) : (
            actionButton
          )
        )}
        {children}
      </div>
    </div>
  );
}
