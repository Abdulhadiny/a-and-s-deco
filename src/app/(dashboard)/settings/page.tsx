"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Package, Settings2, ShieldCheck, MapPin, Wallet } from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/lib/hooks/use-permissions";

const settingsSections = [
  {
    title: "User Management",
    description: "Manage system users, roles, and permissions",
    icon: Users,
    href: "/settings/users",
    permission: "users:manage",
  },
  {
    title: "Locations",
    description: "Manage warehouses and event sites",
    icon: MapPin,
    href: "/settings/locations",
    permission: "settings:manage",
  },
  {
    title: "Product Catalog",
    description: "Manage item categories and descriptions",
    icon: Package,
    href: "/settings/products",
    permission: "inventory:manage",
  },
  {
    title: "Expense Categories",
    description: "Manage types of business expenses",
    icon: Wallet,
    href: "/settings/expense-categories",
    permission: "finance:manage",
  },
  {
    title: "System Configuration",
    description: "Global business settings and defaults",
    icon: Settings2,
    href: "/settings/configuration",
    permission: "settings:manage",
  },
  {
    title: "Audit Log",
    description: "View immutable logs of all system actions",
    icon: ShieldCheck,
    href: "/settings/audit-log",
    permission: "settings:manage",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { hasPermission, isLoaded, isAdmin } = usePermissions();

  useEffect(() => {
    if (isLoaded && !isAdmin && !hasPermission("settings:manage")) {
      router.replace("/");
    }
  }, [isLoaded, isAdmin, hasPermission, router]);

  const filteredSections = settingsSections.filter(section => 
    isAdmin || hasPermission(section.permission)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Global system configuration and management"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSections.map((section) => (
          <Link key={section.href} href={section.href} className="group">
            <Card className="h-full cursor-pointer transition-colors hover:border-primary/30 border-border bg-card">
              <CardHeader>
                <div className="mb-2 w-fit rounded-lg bg-primary/10 p-2.5 text-primary">
                  <section.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-foreground">{section.title}</CardTitle>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {section.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
