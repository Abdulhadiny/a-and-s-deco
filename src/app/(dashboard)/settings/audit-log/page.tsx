import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AuditLogClient } from "./client";
import { AuditAction, Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    action?: string;
    module?: string;
  }>;
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user?.role !== "super_admin") {
    redirect("/settings");
  }

  const params = await searchParams;
  const page = Number(params.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};

  if (params.search) {
    const searchString = params.search.trim();
    where.OR = [
      { recordTable: { contains: searchString, mode: "insensitive" } },
      { recordId: { contains: searchString, mode: "insensitive" } },
      { module: { contains: searchString, mode: "insensitive" } },
      { user: { name: { contains: searchString, mode: "insensitive" } } },
    ];
  }

  if (params.action && params.action !== "all") {
    where.action = params.action as AuditAction;
  }

  if (params.module && params.module !== "all") {
    where.module = params.module;
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Immutable logs tracking all system operations and modifications"
      />

      <AuditLogClient
        logs={logs}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        currentSearch={params.search || ""}
        currentAction={params.action || "all"}
        currentModule={params.module || "all"}
      />
    </div>
  );
}
