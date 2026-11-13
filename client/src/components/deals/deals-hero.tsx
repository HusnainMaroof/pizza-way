export function DealsHero() {
  return (
    <section
      className="flex w-full flex-col items-start gap-24 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#03872d_0%,#036a24_50%,#024d1a_100%)] px-80 py-96 max-lg:gap-[16px] max-lg:px-[40px] max-lg:py-[64px] max-sm:gap-[12px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="deals-hero-title"
    >
      <p className="w-full font-heading text-16 font-extrabold uppercase leading-[normal] text-pw-green-500 max-lg:text-[14px] max-sm:text-[12px]">
        LIMITED TIME VALUE
      </p>
      <h1
        id="deals-hero-title"
        className="w-full font-heading text-110 font-black leading-95 text-white max-lg:text-[length:clamp(44px,9vw,88px)] max-lg:leading-[0.95] max-sm:text-[length:clamp(36px,11.5vw,56px)]"
      >
        <span className="block">BIG DEALS.</span>
        <span className="block">BIGGER BITES.</span>
      </h1>
    </section>
  );
}
