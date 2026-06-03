"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/finance", label: "Overview" },
  { href: "/finance/expenses", label: "Expenses" },
  { href: "/finance/pnl", label: "Profit & Loss" },
];

export function FinanceNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-4 sm:mb-6 flex gap-1 rounded-lg bg-zinc-900 p-1 overflow-x-auto border border-zinc-800 w-fit">
      {links.map((link) => {
        const isActive =
          link.href === "/finance"
            ? pathname === "/finance"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap min-h-[36px] flex items-center",
              isActive
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
