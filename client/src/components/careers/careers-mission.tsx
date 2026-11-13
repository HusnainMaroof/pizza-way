import Image from "next/image";

/** Careers: Life At Pizzaway quote banner (Figma 184:132). */
export function CareersMission() {
  return (
    <section
      className="relative isolate flex w-full flex-col items-center gap-24 overflow-hidden p-100 text-center leading-[normal] max-lg:gap-[20px] max-lg:px-[40px] max-lg:py-[72px] max-sm:gap-[16px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="careers-mission-title"
    >
      <Image
        src="/brand/careers/mission-banner.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-pw-green-900/80" />
      <h2
        id="careers-mission-title"
        className="font-heading text-18 font-extrabold uppercase leading-[normal] text-pw-green-500 max-lg:text-[15px] max-sm:text-[13px]"
      >
        Life at Pizzaway
      </h2>
      <figure className="m-0 flex flex-col items-center gap-24 max-lg:gap-[20px] max-sm:gap-[16px]">
        <blockquote className="m-0 w-900 max-w-full wrap-break-word font-heading text-44 font-black leading-[normal] text-white max-lg:w-[680px] max-lg:text-[length:clamp(26px,4.6vw,40px)] max-lg:leading-[1.2] max-sm:w-full max-sm:text-[length:clamp(22px,7vw,30px)]">
          &quot;The energy in the kitchen is unmatched. We work hard under pressure, but we
          celebrate together. The support for growth here is real.&quot;
        </blockquote>
        <figcaption className="font-body text-16 font-bold leading-[normal] text-pw-green-100 max-lg:text-[15px] max-sm:text-[14px]">
          — Sarah Jenkins, Shift Lead (Soho Branch)
        </figcaption>
      </figure>
    </section>
  );
}
