import Image from "next/image";
import Link from "next/link";

export function PromoBanner() {
  return (
    <section
      className="flex w-full items-center gap-48 bg-pw-red-600 p-80 max-lg:flex-col max-lg:items-stretch max-lg:gap-[32px] max-lg:px-[40px] max-lg:py-[64px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="promo-banner-title"
    >
      <div className="relative h-380 w-540 shrink-0 overflow-hidden rounded-32 max-lg:aspect-[540/380] max-lg:h-auto max-lg:w-full max-lg:rounded-[24px] max-sm:rounded-[20px]">
        <Image
          src="/brand/deals/promo-family-feast.png"
          alt="Family sharing sourdough pizzas, garlic bread and soft drinks at an outdoor table"
          fill
          sizes="(max-width: 1023px) 92vw, 38vw"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-32 max-lg:flex-auto max-lg:gap-[24px] max-sm:gap-[20px]">
        <div className="flex w-full flex-col items-start gap-16 max-lg:gap-[12px]">
          <p className="rounded-pill bg-[#ff5e5a] px-16 py-8 font-heading text-12 font-extrabold uppercase leading-[normal] whitespace-nowrap text-white max-lg:px-[14px] max-lg:py-[6px]">
            BEST VALUE SYSTEM
          </p>
          <h2
            id="promo-banner-title"
            className="w-380 font-heading text-48 font-black leading-[normal] text-white max-lg:w-auto max-lg:text-[length:clamp(30px,5.5vw,44px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(28px,8.5vw,36px)]"
          >
            Family Feast Combo
          </h2>
          <p className="w-full lg:max-w-380 font-body text-16 font-normal leading-26 text-[#ffebee] max-lg:max-w-[600px] max-lg:text-[16px] max-lg:leading-[1.6] max-sm:text-[15px]">
            Any 3 Sourdough Pizzas + 3 Ice Cold Soft Drinks + 6 Hand-battered Garlic Bread. Formulated to feed the entire team without compromise.
          </p>
        </div>

        <div className="flex items-center gap-40 max-lg:flex-wrap max-lg:gap-x-[32px] max-lg:gap-y-[16px] max-sm:w-full max-sm:flex-col max-sm:items-stretch">
          <div className="flex flex-col items-start gap-4 leading-[normal] whitespace-nowrap">
            <p className="font-body text-13 font-normal uppercase text-[#ffebee] max-lg:text-[13px]">
              COMPLETE FEED SYSTEM
            </p>
            <p className="font-heading text-48 font-black text-white max-lg:text-[length:clamp(32px,5vw,44px)]">
              £38.00
            </p>
          </div>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-white px-36 py-18 font-heading text-16 font-extrabold uppercase leading-[normal] text-pw-red-600 no-underline max-lg:min-h-[52px] max-lg:px-[36px] max-lg:py-[14px] max-lg:text-[16px] max-sm:w-full"
          >
            Order Now
          </Link>
        </div>
      </div>
    </section>
  );
}
