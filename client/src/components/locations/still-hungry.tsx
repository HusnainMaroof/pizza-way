import Link from "next/link";

/**
 * Locations: "STILL HUNGRY?" CTA from the top of the Branded Footer (Figma 97:2342 / 97:2343).
 * Only the CTA band: 100 top padding, 80 bottom (the footer's gap down to its first divider).
 */
export function StillHungry() {
  return (
    <section
      className="w-full bg-pw-green-900 px-80 pb-80 pt-100 max-lg:px-[40px] max-lg:pb-[56px] max-lg:pt-[72px] max-sm:px-[20px] max-sm:pb-[48px] max-sm:pt-[56px]"
      aria-labelledby="still-hungry-title"
    >
      <div className="flex w-full items-center justify-between gap-40 max-lg:gap-[32px] max-sm:flex-col max-sm:items-start max-sm:gap-[28px]">
        <div className="flex w-700 shrink-0 flex-col items-start gap-16 max-lg:w-auto max-lg:min-w-0 max-lg:shrink max-lg:gap-[12px]">
          <h2
            id="still-hungry-title"
            className="w-full font-heading text-[length:calc(90*var(--u))] font-black leading-84 text-white max-lg:text-[length:clamp(44px,7.5vw,80px)] max-lg:leading-[0.95] max-sm:text-[length:clamp(36px,12vw,56px)]"
          >
            STILL HUNGRY?
          </h2>
          <p className="w-full font-body text-20 font-normal leading-[normal] text-pw-green-100 max-lg:text-[18px] max-lg:leading-[1.4] max-sm:text-[16px]">
            Initiate your sourdough formulation now and secure rapid delivery.
          </p>
        </div>
        <Link
          href="/menu"
          className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-pill bg-pw-red-600 px-36 py-18 font-heading text-16 font-extrabold uppercase leading-[normal] text-white no-underline max-lg:min-h-[52px] max-lg:px-[32px] max-lg:py-[16px] max-lg:text-[16px] max-sm:w-full"
        >
          ORDER NOW
        </Link>
      </div>
    </section>
  );
}
