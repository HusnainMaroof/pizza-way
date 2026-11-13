/** Privacy Policy: Hero (Figma 184:248). */
export function PrivacyHero() {
  return (
    <section
      className="w-full bg-pw-green-900 px-80 py-96 max-lg:px-[40px] max-lg:py-[64px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="privacy-hero-title"
    >
      <div className="flex w-full flex-col items-center gap-16 text-center max-lg:gap-[16px]">
        <span className="inline-flex rounded-pill bg-pw-green-700 px-16 py-8 font-heading text-12 leading-[normal] font-extrabold text-white uppercase max-lg:px-[16px] max-lg:py-[8px]">
          Data Safety Assurance
        </span>
        <h1
          id="privacy-hero-title"
          className="font-heading text-72 leading-[normal] font-black text-white uppercase max-lg:text-[length:clamp(40px,8vw,64px)] max-lg:leading-[1.05] max-sm:text-[length:clamp(32px,11vw,48px)]"
        >
          Privacy Policy
        </h1>
        <p className="w-720 max-w-full font-body text-20 leading-32 font-normal text-pw-green-100 max-lg:w-full max-lg:max-w-[640px] max-lg:text-[18px] max-lg:leading-[1.6] max-sm:text-[16px]">
          Your trust matters. Here is how we protect your data. Real-time ingredient transparency
          and secure delivery telemetry built on complete respect for your privacy.
        </p>
      </div>
    </section>
  );
}
