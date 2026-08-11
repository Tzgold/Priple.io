import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteNav } from "@/components/marketing/SiteNav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-atmosphere min-h-screen">
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}
