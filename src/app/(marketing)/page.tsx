import { FeatureBento } from "@/components/marketing/FeatureBento";
import { Hero } from "@/components/marketing/Hero";
import { SocialProof } from "@/components/marketing/SocialProof";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeatureBento />
      <SocialProof />
    </main>
  );
}
