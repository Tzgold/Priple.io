import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

const variants = {
  primary:
    "bg-white text-[#09090b] hover:bg-zinc-200 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
  secondary:
    "bg-transparent text-white border border-white/15 hover:bg-white/[0.04] hover:border-white/25",
  ghost: "bg-transparent text-zinc-300 hover:text-white hover:bg-white/[0.04]",
  outline:
    "bg-[#1c1c1c] text-white border border-white/10 hover:bg-[#222] hover:border-white/16",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  disabled,
  onClick,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-mono font-medium transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    className,
  );

  if (href) {
    const external = href.startsWith("http");
    if (external) {
      return (
        <a href={href} className={classes} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
