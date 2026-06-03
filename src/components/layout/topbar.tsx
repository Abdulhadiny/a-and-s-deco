"use client";

import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, LogOut, Loader2, Sparkles, Command, Settings, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/components/providers/sidebar-provider";

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();
  const { toggle } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global search implementation will come in later phases
  const isSearching = false;
  const searchResults: any[] = [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    const handleKeyDown = (event: Event) => {
      const e = event as KeyboardEvent;
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 md:px-6 backdrop-blur-2xl">
      <div className="flex w-full max-w-xl items-center gap-2 md:gap-3" ref={searchRef}>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 h-9 w-9 rounded-lg bg-muted text-foreground"
          onClick={toggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Search (Ctrl + K)..."
            className="h-9 md:h-10 w-full rounded-lg pl-9 pr-10 text-sm font-medium tracking-tight bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-ring/50"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted border border-border/50 text-muted-foreground opacity-70 group-focus-within:opacity-0 transition-opacity">
            <Command className="h-3 w-3" />
            <span className="text-[10px] font-medium">K</span>
          </div>

          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-10 top-1/2 -translate-y-1/2"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showResults && searchQuery.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute top-full left-0 mt-2 w-full rounded-xl bg-popover border border-border p-2 shadow-md z-50 overflow-hidden"
              >
                <div className="flex flex-col gap-0.5">
                  {searchResults.length > 0 ? (
                    searchResults.map((result: any) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => {
                          router.push(result.href);
                          setShowResults(false);
                          setSearchQuery("");
                        }}
                        className="flex flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">{result.title}</span>
                          <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            {result.type}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      </button>
                    ))
                  ) : !isSearching ? (
                    <div className="px-3 py-8 text-center">
                      <Sparkles className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        No results for &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="h-6 w-px bg-border hidden md:block" />

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-xl border border-border hover:bg-muted p-0 overflow-hidden cursor-pointer transition-colors shadow-sm">
              <Avatar className="h-full w-full rounded-none">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs md:text-sm rounded-none">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          } />
          <DropdownMenuContent className="w-64 rounded-xl p-2 mt-2 bg-popover shadow-md border-border" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal px-3 py-3">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-semibold text-foreground leading-none">{user?.name}</p>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted px-2 py-0.5 rounded w-fit">
                    {user?.role?.name || "STAFF"}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="mx-2 my-1" />
            <div className="space-y-0.5">
              <DropdownMenuItem
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                onClick={() => router.push("/settings/profile")}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                onClick={() => router.push("/settings")}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="mx-2 my-1" />
            <DropdownMenuItem
              className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
