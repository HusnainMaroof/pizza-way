import Link from "next/link";

const BUTTON =
  "inline-flex items-center justify-center whitespace-nowrap rounded-pill px-32 py-16 font-heading text-15 font-extrabold uppercase leading-[normal] text-white no-underline max-lg:min-h-[48px] max-lg:px-[32px] max-lg:py-[14px] max-lg:text-[14px] max-sm:w-full max-sm:px-[24px]";

/** About: Join The Crew CTA (Figma 97:2493). */
export function JoinCrewCta() {
  return (
    <section
      className="flex w-full flex-col items-center gap-32 bg-pw-green-900 p-96 text-center max-lg:gap-[24px] max-lg:px-[40px] max-lg:py-[72px] max-sm:gap-[20px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="join-crew-title"
    >
      <h2
        id="join-crew-title"
        className="font-heading text-44 font-black leading-[normal] text-white max-lg:text-[length:clamp(30px,5vw,40px)] max-sm:text-[length:clamp(26px,8vw,34px)]"
      >
        JOIN THE CREW
      </h2>
      <p className="w-600 max-w-full font-body text-18 font-normal leading-[normal] text-pw-green-100 max-lg:w-[560px] max-lg:text-[16px] max-lg:leading-[1.5] max-sm:w-full max-sm:text-[15px]">
        We are always on the lookout for talented dough-stretchers, operational visionaries, and quick-couriers. Explore
        our current career opportunities across our UK locations.
      </p>
      <div className="flex items-start gap-16 max-lg:gap-[12px] max-sm:w-full max-sm:max-w-[360px] max-sm:flex-col max-sm:items-stretch">
        <Link href="/careers" className={`${BUTTON} bg-pw-red-600`}>
          View Open Roles
        </Link>
        <Link href="/careers#culture" className={`${BUTTON} border-[1.5px] border-white`}>
          Learn About Culture
        </Link>
      </div>
    </section>
  );
}
