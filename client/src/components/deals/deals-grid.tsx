import Image from "next/image";
import Link from "next/link";

export type Deal = {
  id: string;
  title: string;
  badge: string;
  description: string;
  price: string;
  image: string;
};

export const deals: Deal[] = [
  {
    id: "solo-saver",
    title: "Solo Saver",
    badge: '7" Pizza + Side + Drink',
    description: "Perfect recipe mapping for individual focused sessions.",
    price: "£6.00",
    image: "/brand/deals/deal-solo-saver.png",
  },
  {
    id: "classic-meal",
    title: "Classic Meal",
    badge: '9" Pizza + Side + Drink',
    description: "The standard culinary package for normal operational flow.",
    price: "£8.00",
    image: "/brand/deals/deal-classic-meal.png",
  },
  {
    id: "large-bite",
    title: "Large Bite",
    badge: '12" Pizza + Side + Drink',
    description:
      "Extended capacity formula when standard metrics aren't enough.",
    price: "£11.00",
    image: "/brand/deals/deal-large-bite.png",
  },
  {
    id: "mega-meal",
    title: "Mega Meal",
    badge: '15" Pizza + 2 Sides + 2 Drinks',
    description:
      "The complete multi-variable meal package for pair programming or group syncs.",
    price: "£14.00",
    image: "/brand/deals/deal-mega-meal.png",
  },
];

function DealCard({ deal }: { deal: Deal }) {
  return (
    <article className="flex min-w-0 flex-col items-start gap-24 overflow-hidden rounded-28 border-[1.5px] border-pw-line bg-pw-surface p-24 max-lg:gap-[20px] max-lg:rounded-[24px] max-lg:p-[20px] max-sm:gap-[16px] max-sm:p-[16px]">
      <div className="relative h-220 w-full overflow-hidden rounded-16 max-lg:aspect-[16/9] max-sm:aspect-[560/260] max-lg:h-auto max-lg:rounded-[14px]">
        <Image
          src={deal.image}
          alt={deal.title}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1023px) 45vw, 42vw"
          className="object-cover"
        />
      </div>
      <div className="flex w-full flex-col items-start gap-16 max-lg:flex-auto max-lg:gap-[12px]">
        <div className="flex w-full items-center justify-between gap-12 max-lg:flex-wrap max-lg:gap-x-[12px] max-lg:gap-y-[8px]">
          <h3 className="whitespace-nowrap font-heading text-24 font-extrabold leading-[normal] text-pw-ink max-lg:text-[20px] max-sm:text-[19px]">
            {deal.title}
          </h3>
          <p className="whitespace-nowrap rounded-pill bg-pw-green-700 px-12 py-6 font-heading text-11 font-extrabold uppercase leading-[normal] text-white max-lg:px-[10px] max-lg:py-[5px] max-lg:text-[11px]">
            {deal.badge}
          </p>
        </div>
        <p className="w-full font-body text-14 font-normal leading-22 text-pw-muted max-lg:text-[14px] max-lg:leading-[22px]">
          {deal.description}
        </p>
        <div className="flex w-full items-center justify-between gap-12 max-lg:mt-auto max-lg:flex-wrap max-lg:gap-x-[12px] max-lg:gap-y-[8px]">
          <p className="whitespace-nowrap font-heading text-32 font-black leading-[normal] text-pw-red-600 max-lg:text-[28px] max-sm:text-[26px]">
            {deal.price}
          </p>
          <Link
            href="/menu"
            aria-label={`Order ${deal.title} deal`}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-pw-red-600 px-24 py-12 font-heading text-13 font-extrabold uppercase leading-[normal] text-white no-underline max-lg:min-h-[44px] max-lg:px-[24px] max-lg:py-[12px] max-lg:text-[13px]"
          >
            Order Deal
          </Link>
        </div>
      </div>
    </article>
  );
}

export function DealsGrid() {
  return (
    <section
      className="flex w-full flex-col items-start gap-56 bg-white p-96 max-lg:gap-[40px] max-lg:px-[40px] max-lg:py-[64px] max-sm:gap-[28px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="deals-grid-title"
    >
      <div className="flex w-full flex-col items-center gap-12 text-center leading-[normal] max-lg:gap-[8px]">
        <p className="font-heading text-16 font-extrabold uppercase text-pw-green-700 max-lg:text-[14px] max-sm:text-[13px]">
          EXPRESS PACKAGES
        </p>
        <h2
          id="deals-grid-title"
          className="font-heading text-44 font-black leading-[normal] text-pw-ink max-lg:text-[length:clamp(28px,4.5vw,40px)] max-lg:leading-[1.15] max-sm:text-[length:clamp(26px,7.5vw,34px)]"
        >
          Selected Formulas
        </h2>
      </div>

      <div className="grid w-full grid-cols-2 items-stretch gap-32 max-lg:gap-[20px] max-sm:grid-cols-1 max-sm:gap-[16px]">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </section>
  );
}
