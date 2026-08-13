import { Audience } from "@/components/marketing/Audience";
import { FaqTeaser } from "@/components/marketing/Faq";
import { Hero } from "@/components/marketing/Hero";
import { AlertsScene } from "@/components/marketing/scenes/AlertsScene";
import { CoinIntelligenceScene } from "@/components/marketing/scenes/CoinIntelligenceScene";
import { FlowsScene } from "@/components/marketing/scenes/FlowsScene";
import { NarrativeScene } from "@/components/marketing/scenes/NarrativeScene";
import { OpportunityScene } from "@/components/marketing/scenes/OpportunityScene";
import { SmartMoneyScene } from "@/components/marketing/scenes/SmartMoneyScene";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <div className="space-y-20 overflow-visible sm:space-y-28">
        <SmartMoneyScene />
        <AlertsScene />
        <OpportunityScene />
        <FlowsScene />
        <NarrativeScene />
        <CoinIntelligenceScene />
      </div>
      <Audience />
      <FaqTeaser />
    </main>
  );
}
