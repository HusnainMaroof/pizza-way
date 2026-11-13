import Link from "next/link";

const BUTTON =
  "inline-flex items-center justify-center whitespace-nowrap rounded-pill px-32 py-16 font-heading text-14 font-extrabold uppercase leading-[normal] text-white no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-lg:min-h-[48px] max-lg:px-[32px] max-lg:py-[14px] max-lg:text-[14px] max-sm:w-full max-sm:px-[24px]";

/** Careers: Ready To Stretch Sourdough CTA (Figma 184:157). */
export function CareersCta() {
  return (
    <section
      className="flex w-full flex-col items-center gap-32 bg-pw-green-900 p-96 text-center [word-break:break-word] max-lg:gap-[24px] max-lg:px-[40px] max-lg:py-[72px] max-sm:gap-[20px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="careers-cta-title"
    >
      <h2
        id="careers-cta-title"
        className="font-heading text-44 font-black leading-[normal] text-white max-lg:text-[length:clamp(30px,5vw,40px)] max-lg:leading-[1.15] max-sm:text-[length:clamp(24px,7.5vw,32px)]"
      >
        READY TO STRETCH SOURDOUGH?
      </h2>
      <p className="w-600 max-w-full font-body text-18 font-normal leading-[normal] text-pw-green-100 max-lg:w-[560px] max-lg:text-[16px] max-lg:leading-[1.5] max-sm:w-full max-sm:text-[15px]">
        We have open career opportunities across all major UK metropolitan locations. Take the first step today.
      </p>
      <div className="flex items-start gap-16 max-lg:gap-[12px] max-sm:w-full max-sm:max-w-[360px] max-sm:flex-col max-sm:items-stretch">
        <Link href="/careers/open-roles" className={`${BUTTON} bg-pw-red-600`}>
          Submit Fast Application
        </Link>
        <Link href="/locations" className={`${BUTTON} border-[1.5px] border-solid border-white`}>
          Find Nearest Store
        </Link>
      </div>
    </section>
  );
}
