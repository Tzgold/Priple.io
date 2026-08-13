import { cn } from "@/lib/cn";

function Crosshair({ className }: { className?: string }) {
  return <span aria-hidden className={cn("crosshair", className)} />;
}

export function HeroGrid() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <span className="guide-hline top-0" />
      <span className="guide-hline bottom-0" />
      <span className="guide-vline left-0" />
      <span className="guide-vline right-0" />
      <span className="hero-split hidden lg:block" />
      <Crosshair className="left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="right-0 top-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />
      <Crosshair className="hero-split-cross top-0 hidden -translate-x-1/2 -translate-y-1/2 lg:block" />
      <Crosshair className="hero-split-cross bottom-0 hidden -translate-x-1/2 translate-y-1/2 lg:block" />
    </div>
  );
}
