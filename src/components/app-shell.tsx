"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { LayoutGrid, Files, UserRound, LogOut, Gauge, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/gallery", label: "Gallery", icon: LayoutGrid },
  { href: "/ats-checker", label: "ATS Score", icon: Gauge },
  { href: "/dashboard", label: "Resumes", icon: Files },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-2xl" suppressHydrationWarning>
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-3 sm:px-6 lg:px-8">
          <a href="/gallery" className="group flex items-center gap-2.5 text-[15px] font-semibold tracking-tight" suppressHydrationWarning>
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-accent text-[11px] font-bold text-accent-foreground shadow-[0_8px_16px_-8px_rgba(196,92,38,0.85)]">
              R
            </span>
            ATSWeave
          </a>
          <nav className="hidden items-center gap-0.5 rounded-full border border-border bg-card/70 p-1 sm:flex">
            {links.map((link) => {
              const active = mounted && pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] text-muted-foreground transition hover:text-foreground",
                    active && "bg-accent text-accent-foreground shadow-sm",
                  )}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <span className="hidden min-w-16 text-[13px] text-muted-foreground sm:inline" suppressHydrationWarning>
              {mounted ? data?.user?.name : "\u00a0"}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <button
              className="hidden rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground max-sm:inline-flex"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="border-t border-border bg-card px-4 py-3 sm:hidden">
            <div className="flex flex-col gap-1">
              {links.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                      active && "bg-muted text-foreground",
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
