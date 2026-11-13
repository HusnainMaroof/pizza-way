import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { MenuHero } from "@/components/menu/menu-hero";

export const metadata: Metadata = {
  title: "Menu | Pizza Way",
  description: "Fresh sourdough pizzas, sides and extras. Build your order at Pizza Way.",
};

export default function MenuPage() {
  return (
    <>
      <NavHeader sticky />
      <main>
        <MenuHero />
        <MenuBrowser />
      </main>
      <SiteFooter />
    </>
  );
}
