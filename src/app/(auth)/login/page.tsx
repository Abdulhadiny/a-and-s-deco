"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2Icon, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — dark brand panel */}
      <div className="relative hidden lg:flex lg:w-[42%] flex-col justify-between bg-sidebar overflow-hidden p-10">
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full border border-white/5" />
        <div className="pointer-events-none absolute top-1/2 right-0 h-[1px] w-24 bg-sidebar-border" />

        {/* Amber glow blob */}
        <div className="pointer-events-none absolute top-1/3 -left-12 h-64 w-64 rounded-full bg-sidebar-primary/10 blur-3xl" />

        {/* Logo mark */}
        <div className="relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-primary shadow-lg shadow-sidebar-primary/30">
            <Sparkles className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        </div>

        {/* Brand copy */}
        <div className="relative z-10 space-y-4">
          <div>
            <h1 className="font-heading text-4xl font-normal leading-tight text-sidebar-foreground">
              A&amp;S<br />Decorations
            </h1>
            <p className="mt-3 text-sm font-medium text-sidebar-foreground/40 uppercase tracking-widest">
              Event Management System
            </p>
          </div>

          {/* Divider dots */}
          <div className="flex items-center gap-2 pt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
            <span className="h-1 w-1 rounded-full bg-sidebar-foreground/20" />
            <span className="h-1 w-1 rounded-full bg-sidebar-foreground/20" />
          </div>

          <p className="max-w-xs text-sm leading-relaxed text-sidebar-foreground/40">
            Inventory tracking, event lifecycle management, and financial reporting — all in one place.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-sidebar-foreground/25">
            &copy; {new Date().getFullYear()} A&amp;S Decorations, Kano.
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {/* Mobile logo (hidden on lg) */}
        <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-normal text-foreground">
            A&amp;S Decorations
          </h1>
        </div>

        <div className="w-full max-w-sm">
          {/* Form header */}
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-normal tracking-tight text-foreground">
              Sign in
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
                className="h-10"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/8 px-3.5 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-1 h-10 w-full gap-2 font-semibold shadow-sm shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
