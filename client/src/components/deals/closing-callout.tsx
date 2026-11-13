import Link from "next/link";

export function ClosingCallout() {
  return (
    <section
      className="flex w-full flex-col items-center gap-40 bg-pw-green-700 px-80 pb-120 pt-96 max-lg:gap-[28px] max-lg:px-[40px] max-lg:pb-[80px] max-lg:pt-[64px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:pb-[56px] max-sm:pt-[48px]"
      aria-labelledby="closing-callout-title"
    >
      <div className="flex flex-col items-center gap-16 text-center leading-[normal] max-lg:gap-[12px]">
        <h2
          id="closing-callout-title"
          className="font-heading text-48 font-black leading-[normal] text-white max-lg:text-[length:clamp(30px,5vw,44px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(26px,8vw,36px)]"
        >
          HUNGRY FOR MORE?
        </h2>
        <p className="font-body text-16 font-normal text-pw-green-100 max-lg:text-[16px] max-sm:text-[15px]">
          See our entire signature series and crafted sourdough menu list.
        </p>
      </div>
      <Link
        href="/menu"
        className="inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-white px-32 py-16 font-heading text-14 font-extrabold uppercase leading-[normal] text-pw-ink no-underline max-lg:min-h-[48px] max-lg:px-[32px] max-lg:py-[14px] max-lg:text-[14px]"
      >
        VIEW FULL MENU
      </Link>
    </section>
  );
}
