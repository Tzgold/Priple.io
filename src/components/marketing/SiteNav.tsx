"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2C6.477 2 2 6.586 2 12.253c0 4.53 2.865 8.37 6.839 9.723.5.094.682-.222.682-.482 0-.237-.009-.866-.014-1.7-2.782.617-3.369-1.372-3.369-1.372-.454-1.178-1.11-1.492-1.11-1.492-.908-.635.069-.622.069-.622 1.003.072 1.53 1.056 1.53 1.056.892 1.563 2.341 1.112 2.91.85.092-.661.35-1.112.636-1.367-2.22-.259-4.555-1.14-4.555-5.073 0-1.12.39-2.037 1.03-2.756-.103-.26-.447-1.302.098-2.714 0 0 .84-.275 2.75 1.052A9.35 9.35 0 0 1 12 6.844a9.35 9.35 0 0 1 2.504.345c1.909-1.327 2.748-1.052 2.748-1.052.546 1.412.202 2.454.1 2.714.64.719 1.028 1.636 1.028 2.756 0 3.944-2.338 4.811-4.566 5.065.359.316.679.942.679 1.899 0 1.37-.012 2.475-.012 2.812 0 .263.18.58.688.48A10.27 10.27 0 0 0 22 12.253C22 6.586 17.523 2 12 2z" />
    </svg>
  );
}

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#wallets", label: "Wallets" },
  { href: "/#screener", label: "Screener" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

export function SiteNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={cn("sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4", className)}>
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between rounded-full border border-white/10 bg-[#121214]/90 px-2 pl-4 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-3 sm:pl-5">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-white">
          Priple
        </Link>

        <nav className="hidden items-center gap-5 lg:flex xl:gap-6">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "text-[13px] transition-colors hover:text-white",
                pathname === link.href || (link.href === "/about" && pathname === "/about")
                  ? "text-white"
                  : "text-zinc-300",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <a
            href="https://github.com/Tzgold/Priple.io"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white sm:px-2.5"
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <Button href="/login" variant="ghost" size="sm" className="hidden h-8 px-3 sm:inline-flex">
            Log in
          </Button>
          <Button href="/signup" size="sm" className="hidden h-8 px-3.5 sm:inline-flex">
            Get started
          </Button>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mx-auto mt-2 max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#121214]/97 p-3 shadow-2xl backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-0.5">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3">
            <Button href="/login" variant="secondary" className="w-full rounded-xl">
              Log in
            </Button>
            <Button href="/signup" className="w-full rounded-xl">
              Get started
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
