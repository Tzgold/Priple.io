import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  trailing?: React.ReactNode;
};

export function Input({ label, trailing, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-2">
      {label ? (
        <span className="text-[13px] font-medium text-zinc-400">{label}</span>
      ) : null}
      <span className="relative block">
        <input
          id={inputId}
          className={cn(
            "w-full h-11 rounded-lg bg-[#1c1c1c] border border-white/10 px-3.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-white/25 focus:bg-[#1f1f1f]",
            trailing && "pr-11",
            className,
          )}
          {...props}
        />
        {trailing ? (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500">
            {trailing}
          </span>
        ) : null}
      </span>
    </label>
  );
}
