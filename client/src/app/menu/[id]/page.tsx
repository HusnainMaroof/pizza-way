import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { pizzas } from "@/components/menu/pizza-data";
import { ProductHero } from "@/components/product/product-hero";
import { ProductQuickAdd } from "@/components/product/product-quick-add";
import { ProductSuggestions } from "@/components/product/product-suggestions";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return pizzas.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pizza = pizzas.find((p) => p.id === id);
  if (!pizza) return { title: "Pizza not found | Pizza Way" };
  return {
    title: `${pizza.name} | Pizza Way`,
    description: pizza.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const pizza = pizzas.find((p) => p.id === id);
  if (!pizza) notFound();

  return (
    <>
      <NavHeader />
      <main>
        <ProductHero pizza={pizza} />
        <ProductQuickAdd />
        <ProductSuggestions currentId={pizza.id} />
      </main>
      <SiteFooter />
    </>
  );
}
