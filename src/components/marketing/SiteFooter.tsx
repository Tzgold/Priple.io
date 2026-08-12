import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Wallets", href: "/#wallets" },
      { label: "Screener", href: "/#screener" },
      { label: "Enter app", href: "/app" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/about#contact" },
      { label: "GitHub", href: "https://github.com/Tzgold/Priple.io" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="md:pr-6">
          <Link href="/" className="text-[15px] font-semibold text-white">
            Priple
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-500">
            Crypto trading intelligence — wallets, markets, and social signals
            in one professional surface.
          </p>
          <p className="mt-5 text-xs leading-5 text-zinc-600">
            Informational research tooling only. Not investment, legal, or tax
            advice.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 transition-colors hover:text-white"
                    {...(link.href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-5xl flex-col gap-2 border-t border-white/[0.06] px-4 py-5 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Priple. All rights reserved.</p>
        <p>Built for evidence-based crypto research.</p>
      </div>
    </footer>
  );
}
