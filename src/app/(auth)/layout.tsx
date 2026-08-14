import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-auth relative flex min-h-screen flex-col">
      <Link
        href="/"
        className="absolute left-6 top-6 z-10 font-mono text-[12px] text-zinc-500 transition-colors hover:text-white"
      >
        ← Home
      </Link>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16">
        {children}
      </div>
    </div>
  );
}
