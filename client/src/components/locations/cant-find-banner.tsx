import Link from "next/link";

/** Locations: "Can't Find Your Local" banner (Figma 97:2335). */
export function CantFindBanner() {
  return (
    <section
      className="flex w-full flex-col items-center gap-32 bg-pw-green-700 px-80 py-100 max-lg:gap-[28px] max-lg:px-[40px] max-lg:py-[72px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="cant-find-title"
    >
      <div className="flex w-full flex-col items-center gap-16 text-center leading-[normal] max-lg:gap-[12px]">
        <p className="font-heading text-14 font-extrabold uppercase leading-[normal] text-pw-green-500 max-lg:text-[14px] max-sm:text-[13px]">
          NOT COVERED?
        </p>
        <h2
          id="cant-find-title"
          className="font-heading text-48 font-black leading-[normal] text-white max-lg:text-[length:clamp(30px,5vw,44px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(24px,7.5vw,34px)]"
        >
          CAN&apos;T FIND YOUR LOCAL?
        </h2>
        <p className="w-600 max-w-full font-body text-16 font-normal leading-[normal] text-pw-green-100 max-lg:w-[560px] max-lg:text-[16px] max-lg:leading-[1.5] max-sm:w-full max-sm:text-[15px]">
          We&apos;re rapid-expanding our hand-stretched Neapolitan sourdough deliveries across the UK. Get in touch to
          request a launch in your postcode!
        </p>
      </div>
      <Link
        href="/contact"
        className="inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-white px-32 py-16 font-heading text-14 font-extrabold uppercase leading-[normal] text-pw-ink no-underline max-lg:min-h-[48px] max-lg:px-[32px] max-lg:py-[14px] max-lg:text-[14px] max-sm:w-full max-sm:max-w-[360px] max-sm:whitespace-normal max-sm:px-[24px] max-sm:text-center"
      >
        REQUEST LAUNCH IN MY AREA
      </Link>
    </section>
  );
}
