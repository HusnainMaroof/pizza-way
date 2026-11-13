import { BuildYourPizza } from "@/components/home/build-your-pizza";
import { DealsOffers } from "@/components/home/deals-offers";
import { FamilyFeast } from "@/components/home/family-feast";
import { FeaturedPizzas } from "@/components/home/featured-pizzas";
import { FindYourPizzaway } from "@/components/home/find-your-pizzaway";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { NavHeader } from "@/components/home/nav-header";
import { QuickOrder } from "@/components/home/quick-order";
import { SiteFooter } from "@/components/home/site-footer";
import { Testimonials } from "@/components/home/testimonials";
import { WhyPizzaway } from "@/components/home/why-pizzaway";

export default function Home() {
  return (
    <>
      <NavHeader />
      <main>
        <Hero />
        <QuickOrder />
        <FeaturedPizzas />
        <BuildYourPizza />
        <DealsOffers />
        <FamilyFeast />
        <WhyPizzaway />
        <HowItWorks />
        <FindYourPizzaway />
        <Testimonials />
      </main>
      <SiteFooter />
    </>
  );
}
