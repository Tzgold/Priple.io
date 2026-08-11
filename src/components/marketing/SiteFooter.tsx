import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Wallets", href: "#wallets" },
      { label: "Screener", href: "#screener" },
      { label: "Enter app", href: "/app" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Docs", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "GitHub", href: "https://github.com/Tzgold/Priple.io" },
      { label: "Contact", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer id="pricing" className="border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-[15px] font-semibold text-white">
            Priple
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-500">
            Crypto trading intelligence — wallets, markets, and social signals
            in one professional surface.
          </p>
          <p className="mt-6 text-xs text-zinc-600">
            Informational only. Not investment advice.
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
                  <a
                    href={link.href}
                    className="text-sm text-zinc-400 transition-colors hover:text-white"
                    {...(link.href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-5xl border-t border-white/[0.06] px-6 py-6 text-xs text-zinc-600">
        © {new Date().getFullYear()} Priple. All rights reserved.
      </div>
    </footer>
  );
}
