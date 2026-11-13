import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { CareersCta } from "@/components/careers/careers-cta";
import { CareersFaq } from "@/components/careers/careers-faq";
import { CareersHero } from "@/components/careers/careers-hero";
import { CareersMission } from "@/components/careers/careers-mission";
import { CareersSteps } from "@/components/careers/careers-steps";
import { CareersValues } from "@/components/careers/careers-values";

export const metadata: Metadata = {
  title: "Careers | Pizza Way",
  description: "Join the Pizza Way crew. Explore open roles across our UK stores.",
};

export default function CareersPage() {
  return (
    <>
      <NavHeader />
      <main>
        <CareersHero />
        <CareersValues />
        <CareersFaq />
        <CareersMission />
        <CareersSteps />
        <CareersCta />
      </main>
      <SiteFooter />
    </>
  );
}
