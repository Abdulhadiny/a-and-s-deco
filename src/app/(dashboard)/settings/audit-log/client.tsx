"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, ShieldAlert, Search } from "lucide-react";

interface AuditLogData {
  id: string;
  userId: string | null;
  action: string;
  module: string;
  recordId: string;
  recordTable: string;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  createdAt: Date | string;
  user?: {
    name: string;
    email: string;
  } | null;
}

export function AuditLogClient({
  logs,
  total,
  page,
  limit,
  totalPages,
  currentSearch,
  currentAction,
  currentModule,
}: {
  logs: AuditLogData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  currentSearch: string;
  currentAction: string;
  currentModule: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(currentSearch);
  const [selectedLog, setSelectedLog] = useState<AuditLogData | null>(null);

  const updateFilters = (updates: { page?: number; search?: string; action?: string; module?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.page !== undefined) {
      params.set("page", String(updates.page));
    } else {
      params.set("page", "1"); // Reset page when other filters change
    }

    if (updates.search !== undefined) {
      if (updates.search) params.set("search", updates.search);
      else params.delete("search");
    }

    if (updates.action !== undefined) {
      if (updates.action && updates.action !== "all") params.set("action", updates.action);
      else params.delete("action");
    }

    if (updates.module !== undefined) {
      if (updates.module && updates.module !== "all") params.set("module", updates.module);
      else params.delete("module");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const columns: Column<AuditLogData>[] = [
    {
      key: "user",
      header: "User",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.user?.name || "System"}</span>
          {row.user?.email && <span className="text-xs text-muted-foreground">{row.user.email}</span>}
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => {
        const action = row.action;
        switch (action) {
          case "create":
            return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold uppercase text-[10px] tracking-wider">Create</Badge>;
          case "update":
            return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold uppercase text-[10px] tracking-wider">Update</Badge>;
          case "delete":
            return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold uppercase text-[10px] tracking-wider">Delete</Badge>;
          case "read":
            return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold uppercase text-[10px] tracking-wider">Read</Badge>;
          default:
            return <Badge variant="secondary" className="font-bold uppercase text-[10px] tracking-wider">{action}</Badge>;
        }
      },
    },
    {
      key: "module",
      header: "Module",
      cell: (row) => <span className="capitalize text-foreground">{row.module}</span>,
    },
    {
      key: "record",
      header: "Record Target",
      cell: (row) => (
        <div className="flex flex-col max-w-[200px] truncate">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{row.recordTable}</span>
          <span className="font-mono text-xs text-foreground/80 truncate" title={row.recordId}>{row.recordId}</span>
        </div>
      ),
    },
    {
      key: "ipAddress",
      header: "IP Address",
      cell: (row) => <span className="text-muted-foreground font-mono text-xs">{row.ipAddress || "—"}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "createdAt",
      header: "Timestamp",
      cell: (row) => <span className="text-muted-foreground text-xs">{new Date(row.createdAt).toLocaleString()}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-white"
          onClick={() => setSelectedLog(row)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search target record or user..."
              className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground/70 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" className="h-9 font-bold px-3">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Action Filter */}
          <Select
            value={currentAction}
            onValueChange={(val) => updateFilters({ action: val ?? undefined })}
          >
            <SelectTrigger className="bg-muted border-border text-foreground w-[130px] h-9 text-xs">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          {/* Module Filter */}
          <Select
            value={currentModule}
            onValueChange={(val) => updateFilters({ module: val ?? undefined })}
          >
            <SelectTrigger className="bg-muted border-border text-foreground w-[130px] h-9 text-xs">
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="customers">Customers</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        emptyMessage="No audit logs match the current filters."
        pagination={{
          page,
          totalPages,
          total,
          limit,
          onPageChange: (newPage) => updateFilters({ page: newPage }),
        }}
      />

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col bg-card border-border text-foreground p-6 overflow-hidden">
          <DialogHeader className="pb-4 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 pb-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-border text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Performed By</span>
                  <strong className="text-foreground">{selectedLog.user?.name || "System"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">IP Address</span>
                  <strong className="text-foreground font-mono">{selectedLog.ipAddress || "—"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Action / Module</span>
                  <strong className="text-foreground capitalize">{selectedLog.action} ({selectedLog.module})</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Timestamp</span>
                  <strong className="text-foreground">{new Date(selectedLog.createdAt).toLocaleString()}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-xs">Target Table / ID</span>
                  <strong className="text-foreground font-mono text-xs block truncate" title={selectedLog.recordId}>
                    {selectedLog.recordTable} ({selectedLog.recordId})
                  </strong>
                </div>
              </div>

              {selectedLog.oldValues != null && Object.keys(selectedLog.oldValues as Record<string, unknown>).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Before Change</span>
                  <pre className="bg-muted/80 p-3 rounded-lg overflow-auto max-h-[200px] text-[11px] font-mono text-muted-foreground border border-border">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues != null && Object.keys(selectedLog.newValues as Record<string, unknown>).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider block">After Change</span>
                  <pre className="bg-muted p-3 rounded-lg overflow-auto max-h-[200px] text-[11px] font-mono text-foreground border border-border">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}

              {(!selectedLog.oldValues || Object.keys(selectedLog.oldValues).length === 0) &&
                (!selectedLog.newValues || Object.keys(selectedLog.newValues).length === 0) && (
                  <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 border border-dashed border-border rounded-lg">
                    No data payload was recorded for this event.
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
