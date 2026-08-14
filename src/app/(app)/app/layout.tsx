import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar, AppTopBar } from "@/components/app/AppChrome";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white">
      <div className="hidden md:flex">
        <AppSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex gap-1 border-b border-white/[0.07] px-3 py-2 md:hidden">
          {[
            { href: "/app", label: "Overview" },
            { href: "/app/wallets", label: "Wallets" },
            { href: "/app/screener", label: "Screener" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <AppTopBar user={user} />
        <main className="flex-1 overflow-auto p-5 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
