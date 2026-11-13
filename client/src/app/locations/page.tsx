import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { CantFindBanner } from "@/components/locations/cant-find-banner";
import { LocationsBrowser } from "@/components/locations/locations-browser";
import { LocationsHero } from "@/components/locations/locations-hero";
import { StillHungry } from "@/components/locations/still-hungry";

export const metadata: Metadata = {
  title: "Locations | Pizza Way",
  description: "Find a Pizza Way store near you for delivery or collection.",
};

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; mode?: string | string[] }>;
}) {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const mode = Array.isArray(sp.mode) ? sp.mode[0] : sp.mode;
  return (
    <>
      <NavHeader />
      <main>
        <LocationsHero key={`${q ?? ""}|${mode ?? ""}`} initialQ={q ?? ""} initialMode={mode ?? ""} />
        <LocationsBrowser q={q ?? ""} mode={mode ?? ""} />
        <CantFindBanner />
        <StillHungry />
      </main>
      <SiteFooter />
    </>
  );
}
