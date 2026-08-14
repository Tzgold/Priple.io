"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function CopyButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center text-zinc-500 transition-colors hover:text-white",
        className,
      )}
      title="Copy"
      onClick={async () => {
        await navigator.clipboard.writeText(value.replace("…", ""));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" strokeWidth={1.6} />}
    </button>
  );
}
