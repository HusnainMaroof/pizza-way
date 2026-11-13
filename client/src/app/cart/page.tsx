import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { CartContent } from "@/components/cart/cart-content";
import { CartHeader } from "@/components/cart/cart-header";

export const metadata: Metadata = {
  title: "Your Basket | Pizza Way",
  description: "Review your Pizza Way basket and proceed to checkout.",
};

export default function CartPage() {
  return (
    <>
      <NavHeader />
      <main>
        <CartHeader />
        <CartContent />
      </main>
      <SiteFooter />
    </>
  );
}
