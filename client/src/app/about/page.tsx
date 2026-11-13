import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { AboutHero } from "@/components/about/about-hero";
import { JoinCrewCta } from "@/components/about/join-crew-cta";
import { MissionBanner } from "@/components/about/mission-banner";
import { StorySection } from "@/components/about/story-section";
import { TeamSection } from "@/components/about/team-section";
import { ValuesSection } from "@/components/about/values-section";

export const metadata: Metadata = {
  title: "About | Pizza Way",
  description: "Our story, our values and the team behind Pizza Way's hand-stretched sourdough pizza.",
};

export default function AboutPage() {
  return (
    <>
      <NavHeader />
      <main>
        <AboutHero />
        <StorySection />
        <ValuesSection />
        <MissionBanner />
        <TeamSection />
        <JoinCrewCta />
      </main>
      <SiteFooter />
    </>
  );
}
