import { cn } from "@/lib/cn";

export type PetalCorner = "tl-br" | "tr-bl" | "bl-tr" | "br-tl";

/**
 * Screenshot border language:
 * sharp 1px outer frame with dim quarter-circle corner fills.
 */
export function CardBorder() {
  return (
    <div className="priple-card-border" aria-hidden>
      <span className="priple-card-corner priple-card-corner-primary" />
      <span className="priple-card-corner priple-card-corner-secondary" />
    </div>
  );
}

/** Soft dotted atmosphere — no border (avoids double rings). */
export function DotStage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("priple-dot-stage", className)}>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

/** Single large marketing card — screenshot border design. */
export function PripleCard({
  title,
  description,
  children,
  className,
  label,
  petal = "tl-br",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  label?: string;
  petal?: PetalCorner;
}) {
  return (
    <article
      data-petal={petal}
      className={cn("priple-card relative flex h-full min-h-[40rem] flex-col", className)}
    >
      <CardBorder />
      <div className="priple-card-fill relative z-[1] flex min-h-0 flex-1 flex-col">
        {label ? (
          <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
            {label}
          </p>
        ) : null}
        <h3 className="font-sans text-[1.35rem] font-semibold tracking-[-0.025em] text-white sm:text-[1.5rem]">
          {title}
        </h3>
        {description ? (
          <p className="mt-3 max-w-lg font-mono text-[12px] leading-6 text-zinc-400 sm:text-[13px]">
            {description}
          </p>
        ) : null}
        <div className="mt-6 min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </article>
  );
}

/** Nested product UI surface inside a PripleCard. */
export function MockSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("priple-mock scene-muted-grid", className)}>
      {children}
    </div>
  );
}

/** Single outer shell for hero product mock — one border only. */
export function PriplePanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("priple-panel", className)}>{children}</div>;
}
