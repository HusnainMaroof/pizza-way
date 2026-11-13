export function ContactHero() {
  return (
    <section
      className="flex w-full flex-col items-center gap-24 bg-pw-green-900 p-80 text-center max-lg:gap-[16px] max-lg:px-[40px] max-lg:pt-[64px] max-lg:pb-[72px] max-sm:gap-[12px] max-sm:px-[20px] max-sm:pt-[48px] max-sm:pb-[56px]"
      aria-labelledby="contact-hero-title"
    >
      <p className="flex shrink-0 items-start rounded-pill bg-pw-green-700 px-16 py-8 font-heading text-12 leading-[normal] font-extrabold whitespace-nowrap text-white uppercase max-lg:px-[14px] max-lg:py-[7px] max-lg:text-[12px]">
        PIZZAWAY HELPDESK
      </p>
      <h1
        id="contact-hero-title"
        className="w-full font-heading text-72 leading-[normal] font-black text-white max-lg:text-[length:clamp(36px,7.5vw,64px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(30px,10vw,44px)]"
      >
        HOW CAN WE HELP?
      </h1>
    </section>
  );
}
