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
        <ProgressRibbon />
        <ByoWorkspace />
      </main>
      <SiteFooter />
    </>
  );
}
