"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-transparent backdrop-blur-md transition-colors duration-250",
        isScrolled ? "bg-marketing-bg/85 border-marketing-border" : "bg-marketing-bg/40"
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-[1.05rem] font-bold tracking-tight text-white">
          <span className="font-mono text-blue-500">&lt;/&gt;</span>
          DevDrop
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-marketing-text-muted sm:flex">
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#pricing" className="hover:text-white">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
            Sign In
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:from-blue-500 hover:to-indigo-500 hover:opacity-90"
            )}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
