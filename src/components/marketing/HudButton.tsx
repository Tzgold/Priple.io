import Link from "next/link";
import { cn } from "@/lib/cn";

export function HudButton({
  href,
  children,
  className,
  framed = true,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  framed?: boolean;
}) {
  const classes = cn("hud-button", framed && "hud-button-framed", className);

  if (href.startsWith("http")) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer">
        {framed ? <HudTicks /> : null}
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {framed ? <HudTicks /> : null}
      {children}
    </Link>
  );
}

function HudTicks() {
  return (
    <>
      <span aria-hidden className="hud-tick hud-tick-tl" />
      <span aria-hidden className="hud-tick hud-tick-tr" />
      <span aria-hidden className="hud-tick hud-tick-bl" />
      <span aria-hidden className="hud-tick hud-tick-br" />
    </>
  );
}
