import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { ConfirmationDetails } from "@/components/confirmation/confirmation-details";
import { ConfirmationHero } from "@/components/confirmation/confirmation-hero";
import { UpsellsSection } from "@/components/confirmation/upsells-section";

export const metadata: Metadata = {
  title: "Order Confirmed | Pizza Way",
  description: "Your Pizza Way order is confirmed. Track it and see the details.",
  robots: { index: false },
};

export default function OrderConfirmationPage() {
  return (
    <>
      <NavHeader />
      <main>
        <ConfirmationHero />
        <ConfirmationDetails />
        <UpsellsSection />
      </main>
      <SiteFooter />
    </>
  );
}
