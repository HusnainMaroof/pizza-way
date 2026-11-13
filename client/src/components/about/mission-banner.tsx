/** About: Our Global Mission banner (Figma 97:2470). */
export function MissionBanner() {
  return (
    <section
      className="flex w-full flex-col items-center gap-24 bg-pw-green-700 p-100 text-center leading-[normal] max-lg:gap-[20px] max-lg:px-[40px] max-lg:py-[72px] max-sm:gap-[16px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="mission-title"
    >
      <p className="font-heading text-18 font-extrabold uppercase leading-[normal] text-pw-green-500 max-lg:text-[15px] max-sm:text-[13px]">
        OUR GLOBAL MISSION
      </p>
      <h2
        id="mission-title"
        className="w-900 max-w-full wrap-break-word font-heading text-48 font-black leading-[normal] text-white max-lg:w-[680px] max-lg:text-[length:clamp(30px,5vw,44px)] max-lg:leading-[1.15] max-sm:w-full max-sm:text-[length:clamp(24px,7.5vw,34px)]"
      >
        &quot;To make delicious, fresh neapolitan pizza accessible to everyone, everywhere.&quot;
      </h2>
    </section>
  );
}
