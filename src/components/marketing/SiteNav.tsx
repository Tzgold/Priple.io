import Link from "next/link";
import { Sun } from "lucide-react";
import { cn } from "@/lib/cn";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2C6.477 2 2 6.586 2 12.253c0 4.53 2.865 8.37 6.839 9.723.5.094.682-.222.682-.482 0-.237-.009-.866-.014-1.7-2.782.617-3.369-1.372-3.369-1.372-.454-1.178-1.11-1.492-1.11-1.492-.908-.635.069-.622.069-.622 1.003.072 1.53 1.056 1.53 1.056.892 1.563 2.341 1.112 2.91.85.092-.661.35-1.112.636-1.367-2.22-.259-4.555-1.14-4.555-5.073 0-1.12.39-2.037 1.03-2.756-.103-.26-.447-1.302.098-2.714 0 0 .84-.275 2.75 1.052A9.35 9.35 0 0 1 12 6.844a9.35 9.35 0 0 1 2.504.345c1.909-1.327 2.748-1.052 2.748-1.052.546 1.412.202 2.454.1 2.714.64.719 1.028 1.636 1.028 2.756 0 3.944-2.338 4.811-4.566 5.065.359.316.679.942.679 1.899 0 1.37-.012 2.475-.012 2.812 0 .263.18.58.688.48A10.27 10.27 0 0 0 22 12.253C22 6.586 17.523 2 12 2z" />
    </svg>
  );
}

const links = [
  { href: "#features", label: "Features" },
  { href: "#wallets", label: "Wallets" },
  { href: "#screener", label: "Screener" },
  { href: "#pricing", label: "Pricing" },
  { href: "#", label: "Blog", soon: true },
];

export function SiteNav({ className }: { className?: string }) {
  return (
    <header className={cn("sticky top-0 z-50 px-4 pt-4", className)}>
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between rounded-full border border-white/10 bg-[#121214]/90 px-3 pl-5 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-white">
          Priple
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) =>
            link.soon ? (
              <span
                key={link.label}
                className="cursor-default text-[13px] text-zinc-600"
                title="Coming soon"
              >
                {link.label}
              </span>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] text-zinc-300 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1">
          <a
            href="https://github.com/Tzgold/Priple.io"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Star</span>
          </a>
          <button
            type="button"
            aria-label="Theme"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <Sun className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
