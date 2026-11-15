import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { ByoHero } from "@/components/byo/byo-hero";
import { ByoWorkspace } from "@/components/byo/byo-workspace";
import { ProgressRibbon } from "@/components/byo/progress-ribbon";

export const metadata: Metadata = {
  title: "Build Your Pizza | Pizza Way",
  description: "Choose your size, base, crust and toppings. Make it your way at Pizza Way.",
};

export default function BuildYourPizzaPage() {
  return (
    <>
      <NavHeader />
      <main>
        <ByoHero />
        {/* Desktop: steps + workspace fit one screen. --u is the normal width-based unit, capped by
            screen height (stage height ~ 59px + 853 units, measured with the 50/50 layout), so everything scales together, never cropped. */}
        <div className="lg:[--u:min(clamp(0.6px,calc(100vw/1440),1.5px),calc((100svh-70px)/856))]">
          <ProgressRibbon />
          <ByoWorkspace />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
