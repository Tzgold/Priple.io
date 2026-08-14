import { cn } from "@/lib/cn";

function Crosshair({ className }: { className?: string }) {
  return <span aria-hidden className={cn("crosshair", className)} />;
}

/** Open technical frame: far rails, one crossbar, pluses at the junctions. */
export function OpenFrame({
  className,
  barClassName = "top-[30%]",
}: {
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <span className="guide-vline left-0" />
      <span className="guide-vline right-0" />
      <span className={cn("guide-hline", barClassName)} />
      <Crosshair className={cn("left-0 -translate-x-1/2 -translate-y-1/2", barClassName)} />
      <Crosshair className={cn("right-0 translate-x-1/2 -translate-y-1/2", barClassName)} />
    </div>
  );
}

export function FrameCorners({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-0", className)} aria-hidden>
      <Crosshair className="left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="right-0 top-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />
    </div>
  );
}
