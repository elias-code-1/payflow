import React from "react";
import LandingHeader from "../components/landing/LandingHeader";
import { HeroSection, TrustSection, StatsSection, ProblemSection, FeaturesSection } from "../components/landing/IntroSections";
import { HowItWorksSection, NetworksSection, CurrencySection, CodeSection, DashboardPreviewSection, UseCasesSection, PrivacySection, PlatformsSection } from "../components/landing/ProductSections";
import { PricingSection, TestimonialSection, FaqSection, DownloadsSection, BuildInstructionsSection, DonateSection, FinalCtaSection, LandingFooter } from "../components/landing/GrowthSections";
import "../styles/landing.css";

export default function LandingPage() {
  return (
    <div className="landing">
      <LandingHeader />
      <main>
        <HeroSection />
        <TrustSection />
        <StatsSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PlatformsSection />
        <DownloadsSection />
        <BuildInstructionsSection />
        <NetworksSection />
        <CurrencySection />
        <CodeSection />
        <DashboardPreviewSection />
        <UseCasesSection />
        <PrivacySection />
        <PricingSection />
        <TestimonialSection />
        <FaqSection />
        <DonateSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
