import { cn } from "@/lib/cn";

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

/** Single large marketing card — one clear border, generous size. */
export function PripleCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("priple-card flex h-full flex-col", className)}>
      <h3 className="text-[1.35rem] font-semibold tracking-tight text-white sm:text-[1.5rem]">
        {title}
      </h3>
      <p className="mt-3 max-w-md text-[14px] leading-6 text-zinc-400 sm:text-[15px] sm:leading-7">
        {description}
      </p>
      <div className="mt-6 min-h-0 flex-1">{children}</div>
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
  return <div className={cn("priple-mock", className)}>{children}</div>;
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
