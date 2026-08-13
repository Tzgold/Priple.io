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
  { href: "/#smart-money", id: "smart-money", label: "Smart Money" },
  { href: "/#alerts", id: "alerts", label: "Alerts" },
  { href: "/#opportunity", id: "opportunity", label: "Score" },
  { href: "/#flows", id: "flows", label: "Flows" },
  { href: "/#narrative", id: "narrative", label: "Narratives" },
  { href: "/#intelligence", id: "intelligence", label: "Intelligence" },
  { href: "/#faq", id: "faq", label: "FAQ" },
];

export function SiteNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [navPath, setNavPath] = useState(pathname);

  if (pathname !== navPath) {
    setNavPath(pathname);
    setOpen(false);
    setActiveId("");
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.2, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <header className={cn("sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4", className)}>
      <div className="relative mx-auto flex h-12 max-w-6xl items-center justify-between rounded-2xl border border-white/[0.12] bg-[#0c0c0e]/92 px-3 pl-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-3.5 sm:pl-5">
        <Link href="/" className="text-[14px] font-semibold tracking-tight text-white">
          Priple
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 lg:flex xl:gap-6">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "text-[13px] font-medium transition-colors hover:text-white",
                pathname === "/" && activeId === link.id
                  ? "text-white"
                  : "text-zinc-400",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <a
            href="https://github.com/Tzgold/Priple.io"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center text-zinc-400 transition-colors hover:text-white"
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            <span className="sr-only">GitHub</span>
          </a>
          <Button href="/login" variant="ghost" size="sm" className="hidden h-8 px-3 text-[13px] sm:inline-flex">
            Log in
          </Button>
          <Button href="/signup" size="sm" className="hidden h-8 px-3.5 text-[13px] sm:inline-flex">
            Get started
          </Button>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center text-zinc-300 transition-colors hover:text-white lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0c0c0e]/96 p-3 shadow-2xl backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-0.5">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.1] pt-3">
            <Button href="/login" variant="secondary" className="w-full">
              Log in
            </Button>
            <Button href="/signup" className="w-full">
              Get started
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
