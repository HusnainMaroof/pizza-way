import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { CheckoutRibbon } from "@/components/checkout/checkout-ribbon";
import { CheckoutWorkspace } from "@/components/checkout/checkout-workspace";

export const metadata: Metadata = {
  title: "Checkout | Pizza Way",
  description: "Enter your delivery details and pay securely at Pizza Way.",
};

export default function CheckoutPage() {
  return (
    <>
      <NavHeader />
      <main>
        <CheckoutRibbon />
        <CheckoutWorkspace />
      </main>
      <SiteFooter />
    </>
  );
}
