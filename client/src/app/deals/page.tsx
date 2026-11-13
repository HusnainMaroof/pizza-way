import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { ClosingCallout } from "@/components/deals/closing-callout";
import { DealsGrid } from "@/components/deals/deals-grid";
import { DealsHero } from "@/components/deals/deals-hero";
import { PromoBanner } from "@/components/deals/promo-banner";

export const metadata: Metadata = {
  title: "Deals | Pizza Way",
  description: "Big deals, bigger bites. Meal deals and the Family Feast from Pizza Way.",
};

export default function DealsPage() {
  return (
    <>
      <NavHeader />
      <main>
        <DealsHero />
        <PromoBanner />
        <DealsGrid />
        <ClosingCallout />
      </main>
      <SiteFooter />
    </>
  );
}
