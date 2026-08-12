import { Audience } from "@/components/marketing/Audience";
import { FaqTeaser } from "@/components/marketing/Faq";
import { FeatureShowcases } from "@/components/marketing/FeatureShowcases";
import { Hero } from "@/components/marketing/Hero";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeatureShowcases />
      <Audience />
      <FaqTeaser />
    </main>
  );
}
