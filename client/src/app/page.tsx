import { BuildYourPizza } from "@/components/home/build-your-pizza";
import { DealsOffers } from "@/components/home/deals-offers";
import { FamilyFeast } from "@/components/home/family-feast";
import { FeaturedPizzas } from "@/components/home/featured-pizzas";
import { FormulaSystemStory } from "@/components/home/formula-system-story";
import { FindYourPizzaway } from "@/components/home/find-your-pizzaway";
import { Hero } from "@/components/home/hero";
import { NavHeader } from "@/components/home/nav-header";
import { QuickOrder } from "@/components/home/quick-order";
import { SiteFooter } from "@/components/home/site-footer";
import { Testimonials } from "@/components/home/testimonials";

export default function Home() {
  return (
    <>
      <NavHeader sticky />
      <main>
        <Hero />
        <FeaturedPizzas before={<QuickOrder />} />
        <BuildYourPizza />
        <DealsOffers />
        <FormulaSystemStory before={<FamilyFeast />} />
        <FindYourPizzaway />
        <Testimonials />
      </main>
      <SiteFooter />
    </>
  );
}
