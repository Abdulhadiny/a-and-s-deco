"use client";

import { useSession } from "next-auth/react";

export function usePermissions() {
  const { data: session, status } = useSession();

  const user = session?.user;
  const role = user?.role;
  const permissions = user?.permissions ?? [];

  // For as-deco, role name 'admin' is the super role
  const isAdmin = role === "admin";

  const hasPermission = (perm: string): boolean => {
    if (isAdmin) return true;
    return permissions.includes(perm);
  };

  // Read-only if user has no create/edit/manage/delete permissions (and is not admin)
  const isReadOnly =
    !isAdmin &&
    !permissions.some(
      (p) => p.endsWith(":create") || p.endsWith(":edit") || p.endsWith(":manage") || p.endsWith(":delete") || p.endsWith(":audit")
    );

  const isLoaded = status !== "loading";

  return { role, permissions, isAdmin, isReadOnly, isLoaded, hasPermission };
}
