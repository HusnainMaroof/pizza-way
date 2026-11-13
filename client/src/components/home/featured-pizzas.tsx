import Image from "next/image";
import Link from "next/link";

const pizzas = [
  {
    name: "Margherita",
    price: "From £3.50",
    description:
      "San Marzano DOP tomatoes, fresh fior di latte, extra virgin olive oil, sweet wild basil.",
    image: "/brand/images/featured-margherita.png",
  },
  {
    name: "Pepperoni Plus",
    price: "From £4.50",
    description:
      "Double pepperoni, spicy nduja paste, hot honey drizzle, aged parmesan crust dusting.",
    image: "/brand/images/featured-pepperoni-plus.png",
  },
  {
    name: "Meat Feast",
    price: "From £4.50",
    description:
      "Smoked oak brisket, house-made fennel sausage, dynamic shredded chicken, smoked ham.",
    image: "/brand/images/featured-meat-feast.png",
  },
  {
    name: "American Hot",
    price: "From £4.50",
    description:
      "Spicy jalapeño slices, dynamic red onion slivers, premium pepperoni, hot roito chilli sauce.",
    image: "/brand/images/featured-american-hot.png",
  },
];

export function FeaturedPizzas() {
  return (
    <section
      className="w-full bg-pw-green-700 px-80 py-120 max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="featured-pizzas-title"
    >
      <div className="mx-auto flex flex-col gap-80 max-lg:gap-[40px] max-sm:gap-[32px]">
        <div className="flex items-end justify-between gap-32 max-lg:flex-wrap max-lg:gap-[20px] max-sm:flex-col max-sm:items-start">
          <div className="flex w-600 max-w-full flex-col gap-16 leading-[normal] max-lg:w-auto max-lg:flex-[1_1_360px] max-lg:gap-[10px] max-sm:w-full max-sm:flex-none">
            <p className="font-heading text-14 font-extrabold uppercase text-pw-green-500 max-sm:text-[12px]">
              THE SIGNATURE COLLECTION
            </p>
            <h2
              id="featured-pizzas-title"
              className="font-heading text-56 font-black leading-[normal] text-white max-lg:text-[length:clamp(32px,5vw,46px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(28px,8.5vw,40px)]"
            >
              Crafted without compromise
            </h2>
          </div>
          <Link
            href="/menu"
            className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-pill bg-white px-28 py-14 font-heading text-14 font-extrabold uppercase leading-[normal] text-pw-ink no-underline max-lg:min-h-[44px] max-lg:px-[28px] max-lg:py-[12px] max-lg:text-[14px]"
          >
            View Full Menu
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-32 gap-y-48 max-lg:gap-x-[20px] max-lg:gap-y-[20px] max-sm:grid-cols-1 max-sm:gap-y-[16px]">
          {pizzas.map((pizza) => (
            <article
              key={pizza.name}
              className="flex items-center gap-24 rounded-32 bg-pw-green-900 p-32 max-lg:flex-col max-lg:items-stretch max-lg:gap-[20px] max-lg:p-[24px] max-sm:gap-[16px] max-sm:rounded-[24px] max-sm:p-[20px]"
            >
              <div className="size-200 shrink-0 overflow-hidden rounded-pill max-lg:aspect-square max-lg:h-auto max-lg:w-[min(180px,60%)] max-lg:self-center max-sm:w-[min(200px,70%)]">
                <Image
                  src={pizza.image}
                  alt={pizza.name}
                  width={200}
                  height={200}
                  sizes="(max-width: 640px) 200px, (max-width: 1023px) 180px, 14vw"
                  className="block size-full object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-16 max-lg:flex-auto max-lg:gap-[12px]">
                <div className="flex w-full items-center justify-between gap-12 whitespace-nowrap leading-[normal] max-lg:flex-wrap max-lg:gap-y-[4px] max-lg:whitespace-normal">
                  <h3 className="font-heading text-28 font-extrabold leading-[normal] text-white max-lg:text-[22px] max-lg:leading-[1.2]">
                    {pizza.name}
                  </h3>
                  <p className="font-heading text-22 font-black text-pw-green-500 max-lg:whitespace-nowrap max-lg:text-[18px]">
                    {pizza.price}
                  </p>
                </div>
                <p className="font-body text-14 font-normal leading-22 text-pw-green-100 max-lg:text-[14px] max-lg:leading-[22px]">
                  {pizza.description}
                </p>
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-white px-20 py-10 font-heading text-13 font-extrabold uppercase leading-[normal] text-pw-ink no-underline max-lg:mt-auto max-lg:min-h-[44px] max-lg:px-[22px] max-lg:py-[10px] max-lg:text-[13px] max-sm:w-full"
                >
                  Add to Order
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
