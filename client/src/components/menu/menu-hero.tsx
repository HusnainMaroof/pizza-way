export function MenuHero() {
  return (
    <section
      className="flex w-full flex-col items-start gap-24 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#03872d_0%,#036a24_50%,#024d1a_100%)] px-80 py-96 max-lg:gap-[16px] max-lg:px-[40px] max-lg:py-[64px] max-sm:gap-[12px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="menu-hero-title"
    >
      <h1
        id="menu-hero-title"
        className="w-full font-heading text-110 font-black leading-90 text-white max-lg:text-[length:clamp(48px,11vw,88px)] max-lg:leading-[0.9] max-sm:text-[length:clamp(44px,14vw,64px)]"
      >
        THE MENU
      </h1>
      <p className="w-full font-body text-20 font-normal leading-32 text-pw-green-100 max-lg:max-w-[600px] max-lg:text-[18px] max-lg:leading-[1.6] max-sm:text-[16px]">
        Fresh ingredients. Great taste. Engineered sourdough fired daily to blistered perfection.
      </p>
    </section>
  );
}
