import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { AISection } from "@/components/marketing/AISection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { CTASection } from "@/components/marketing/CTASection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function Home() {
  return (
    <div className="min-h-full bg-marketing-bg text-white">
      <MarketingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AISection />
        <PricingSection />
        <CTASection />
      </main>
      <MarketingFooter />
    </div>
  );
}
