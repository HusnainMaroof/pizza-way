import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { OpenRolesBrowser } from "@/components/careers/open-roles-browser";
import { OpenRolesCta } from "@/components/careers/open-roles-cta";
import { OpenRolesHero } from "@/components/careers/open-roles-hero";

export const metadata: Metadata = {
  title: "Open Roles | Pizza Way",
  description: "Browse and filter open roles across the Pizza Way UK network.",
};

export default function OpenRolesPage() {
  return (
    <>
      <NavHeader />
      <main>
        <OpenRolesHero />
        <OpenRolesBrowser />
        <OpenRolesCta />
      </main>
      <SiteFooter />
    </>
  );
}
