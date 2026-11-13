import Image from "next/image";
import Link from "next/link";
import { pizzas } from "@/components/menu/pizza-data";

/** "You might also like": first 4 pizzas other than the one being viewed. */
export function ProductSuggestions({ currentId }: { currentId: string }) {
  const suggestions = pizzas.filter((p) => p.id !== currentId).slice(0, 4);

  return (
    <section
      className="w-full bg-white p-80 max-lg:px-[40px] max-lg:py-[64px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="product-suggestions-title"
    >
      <div className="flex flex-col gap-40 max-lg:gap-[32px] max-sm:gap-[24px]">
        <h2
          id="product-suggestions-title"
          className="font-heading text-32 font-black uppercase leading-[normal] text-pw-ink max-lg:text-[length:clamp(24px,4.5vw,32px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(22px,7vw,28px)]"
        >
          You might also like
        </h2>

        <ul className="grid grid-cols-4 gap-24 max-lg:grid-cols-2 max-lg:gap-[20px] max-[479px]:grid-cols-1 max-sm:gap-[16px]">
          {suggestions.map((pizza) => (
            <li
              key={pizza.id}
              className="flex min-w-0 flex-col items-center gap-20 rounded-24 border-[1.5px] border-pw-line bg-pw-surface p-24 max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[20px]"
            >
              <Image
                src={pizza.image}
                alt={pizza.name}
                width={1024}
                height={1024}
                className="size-140 shrink-0 rounded-full object-cover max-lg:size-[120px] max-sm:size-[112px]"
              />
              <div className="flex w-full flex-col items-center gap-4 text-center leading-[normal] max-lg:gap-[4px]">
                <h3 className="font-heading text-18 font-extrabold leading-[normal] text-pw-ink max-lg:text-[17px] max-lg:leading-[1.2]">
                  {pizza.name}
                </h3>
                <p className="font-heading text-15 font-black leading-[normal] text-pw-green-700 max-lg:text-[15px]">
                  {pizza.price.replace(/^from/i, "From")}
                </p>
                <p className="line-clamp-2 font-body text-13 font-normal leading-[normal] text-pw-muted max-lg:text-[13px]">
                  {pizza.description}
                </p>
              </div>
              <Link
                href={`/menu/${pizza.id}`}
                aria-label={`Configure ${pizza.name}`}
                className="mt-auto inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-pw-green-700 px-16 py-8 font-heading text-12 font-extrabold uppercase leading-[normal] text-white max-lg:min-h-[44px] max-lg:px-[22px] max-lg:py-[10px] max-lg:text-[12px]"
              >
                Configure
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
