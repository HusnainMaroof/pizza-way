import Image from "next/image";
import Link from "next/link";

const deals = [
  {
    name: "Solo Saver",
    contents: "7” Pizza + Side + Drink",
    price: "£6.00",
    image: "/brand/images/deal-solo-saver.png",
  },
  {
    name: "Classic Meal",
    contents: "9” Pizza + Side + Drink",
    price: "£8.00",
    image: "/brand/images/deal-classic-meal.png",
  },
  {
    name: "Large Bite",
    contents: "12” Pizza + 2 Sides + Drink",
    price: "£11.00",
    image: "/brand/images/deal-large-bite.png",
  },
  {
    name: "Mega Meal",
    contents: "15” Pizza + 2 Sides + 2 Drinks",
    price: "£14.00",
    image: "/brand/images/deal-mega-meal.png",
  },
];

export function DealsOffers() {
  return (
    <section
      className="w-full bg-pw-red-600 px-80 py-120 max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="deals-offers-title"
    >
      <div className="mx-auto flex flex-col items-center gap-64 max-lg:gap-[40px] max-sm:gap-[32px]">
        <div className="flex w-full flex-col items-center gap-16 text-center leading-[normal] text-white max-lg:gap-[10px]">
          <p className="font-heading text-16 font-extrabold uppercase max-lg:text-[14px] max-sm:text-[12px]">
            LIMITED TIME FORMULAS
          </p>
          <h2
            id="deals-offers-title"
            className="font-heading text-56 font-black leading-[normal] max-lg:text-[length:clamp(30px,5.5vw,48px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(28px,8.5vw,40px)]"
          >
            BIG DEALS. BIGGER BITES.
          </h2>
        </div>

        <div className="grid w-full grid-cols-4 items-start gap-24 max-lg:grid-cols-2 max-lg:items-stretch max-lg:gap-[20px] max-sm:grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] max-sm:gap-[16px]">
          {deals.map((deal) => (
            <article
              key={deal.name}
              className="flex flex-col gap-20 overflow-hidden rounded-28 bg-white p-24 max-lg:gap-[16px] max-lg:rounded-[24px] max-lg:p-[20px] max-sm:p-[16px]"
            >
              <div className="relative h-160 w-full overflow-hidden rounded-16 max-lg:aspect-[16/10] max-lg:h-auto">
                <Image
                  src={deal.image}
                  alt={deal.name}
                  fill
                  sizes="(max-width: 640px) 90vw, (max-width: 1023px) 45vw, 20vw"
                  className="object-cover"
                />
              </div>
              <div className="flex w-full flex-col gap-12 max-lg:flex-auto">
                <div className="flex flex-col gap-4 leading-[normal]">
                  <h3 className="font-heading text-20 font-extrabold leading-[normal] text-pw-ink max-lg:text-[20px] max-sm:text-[19px]">
                    {deal.name}
                  </h3>
                  <p className="font-body text-13 font-normal text-pw-muted max-lg:text-[14px]">
                    {deal.contents}
                  </p>
                </div>
                <div className="flex items-center justify-between max-lg:mt-auto max-lg:flex-wrap max-lg:gap-x-[12px] max-lg:gap-y-[8px]">
                  <p className="whitespace-nowrap font-heading text-28 font-black leading-[normal] text-pw-red-600 max-lg:text-[26px] max-sm:text-[24px]">
                    {deal.price}
                  </p>
                  <Link
                    href="/deals"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-pw-green-700 px-20 py-10 font-heading text-13 font-extrabold uppercase leading-[normal] text-white no-underline max-lg:min-h-[44px] max-lg:px-[24px] max-lg:py-[10px] max-lg:text-[13px]"
                  >
                    Order
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
