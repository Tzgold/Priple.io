import { cn } from "@/lib/cn";

export function ProductSection({
  id,
  eyebrow,
  title,
  description,
  children,
  align = "center",
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-6xl scroll-mt-24 px-3 sm:px-6",
        className,
      )}
    >
      <header
        className={cn(
          "mb-8 max-w-3xl sm:mb-11",
          align === "center" && "mx-auto text-center",
        )}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-balance text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl md:text-[2.35rem] md:leading-[1.12]">
          {title}
        </h2>
        <p
          className={cn(
            "mt-4 max-w-2xl text-pretty text-[14px] leading-7 text-zinc-400 sm:text-[15px]",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

export function SceneLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500",
        className,
      )}
    >
      {children}
    </span>
  );
}
