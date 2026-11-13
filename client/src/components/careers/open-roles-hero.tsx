import Image from "next/image";

/** Open Roles: Green Hero (Figma 186:24). */
export function OpenRolesHero() {
  return (
    <section
      className="w-full bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#03872d_0%,#036a24_50%,#024d1a_100%)] px-80 py-96 max-lg:px-[40px] max-lg:py-[64px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="open-roles-hero-title"
    >
      <div className="flex w-full items-center gap-48 max-lg:mx-auto max-lg:max-w-[720px] max-lg:flex-col max-lg:items-stretch max-lg:gap-[40px] max-sm:gap-[28px]">
        <div className="flex w-680 shrink-0 flex-col items-start gap-24 max-lg:w-full max-lg:shrink max-lg:gap-[24px] max-sm:gap-[20px]">
          <span className="inline-flex whitespace-nowrap rounded-pill border-[1.5px] border-pw-green-500 bg-pw-green-900 px-16 py-8 font-heading text-12 leading-[normal] font-extrabold text-pw-green-500 uppercase max-lg:px-[16px] max-lg:py-[8px] max-sm:whitespace-normal">
            Grow with Pizzaway • Careers &amp; Culture
          </span>
          <div className="flex w-full flex-col items-start gap-16 max-lg:gap-[16px]">
            <h1
              id="open-roles-hero-title"
              className="w-full font-heading text-[length:calc(90*var(--u))] leading-85 font-black text-white max-lg:text-[length:clamp(44px,9vw,84px)] max-lg:leading-[0.95] max-sm:text-[length:clamp(36px,11.5vw,56px)]"
            >
              OPEN
              <br />
              ROLES.
            </h1>
            <p className="w-full font-body text-20 leading-32 font-normal text-pw-green-100 max-lg:text-[18px] max-lg:leading-[1.6] max-sm:text-[16px]">
              Find your place in the PizzaWay family. Build your future alongside our signature
              Neapolitan sourdough. We hand-stretch daily, fire hot, and grow together as one team.
            </p>
          </div>
        </div>

        <div className="flex h-450 w-550 shrink-0 flex-col items-center justify-center max-lg:h-auto max-lg:w-full max-lg:shrink">
          <div className="relative h-390 w-520 shrink-0 overflow-hidden rounded-24 max-lg:aspect-[4/3] max-lg:h-auto max-lg:w-full max-lg:shrink max-lg:rounded-[24px] max-sm:rounded-[20px]">
            <Image
              src="/brand/careers/open-roles-hero-baking.png"
              alt="Pizzaway chef tossing sourdough in a brick-walled kitchen with a wood-fired oven"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 37vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
