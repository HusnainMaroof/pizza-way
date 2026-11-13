import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { NeedHelp } from "@/components/tracking/need-help";
import { TrackingBanner } from "@/components/tracking/tracking-banner";
import { TrackingWorkspace } from "@/components/tracking/tracking-workspace";

export const metadata: Metadata = {
  title: "Track Your Order | Pizza Way",
  description: "Follow your Pizza Way order live from the kitchen to your door.",
  robots: { index: false },
};

export default function OrderTrackingPage() {
  return (
    <>
      <NavHeader />
      <main>
        <TrackingBanner />
        <TrackingWorkspace />
        <NeedHelp />
      </main>
      <SiteFooter />
    </>
  );
}
