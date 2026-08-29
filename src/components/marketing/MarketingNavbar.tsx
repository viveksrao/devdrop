"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MarketingNavbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const featuresHref = isHome ? "#features" : "/#features";
  const pricingHref = isHome ? "#pricing" : "/#pricing";
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <a href={featuresHref} className="hover:text-white">
            Features
          </a>
          <a href={pricingHref} className="hover:text-white">
            Pricing
          </a>
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
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

        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="sm:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu />
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72 border-marketing-border bg-marketing-bg sm:hidden">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <nav className="mt-8 flex flex-col gap-1 px-6 text-marketing-text-muted">
            <SheetClose
              nativeButton={false}
              render={
                <a href={featuresHref} className="rounded-md px-2 py-3 text-base hover:text-white" />
              }
            >
              Features
            </SheetClose>
            <SheetClose
              nativeButton={false}
              render={
                <a href={pricingHref} className="rounded-md px-2 py-3 text-base hover:text-white" />
              }
            >
              Pricing
            </SheetClose>
          </nav>
          <div className="mt-4 flex flex-col gap-3 px-6">
            <SheetClose
              nativeButton={false}
              render={<Link href="/sign-in" className={buttonVariants({ variant: "ghost" })} />}
            >
              Sign In
            </SheetClose>
            <SheetClose
              nativeButton={false}
              render={
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:from-blue-500 hover:to-indigo-500 hover:opacity-90"
                  )}
                />
              }
            >
              Get Started
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
