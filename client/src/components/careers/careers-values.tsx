const VALUES = [
  {
    title: "FLEXIBLE HOURS",
    icon: "/brand/careers/value-clock.svg",
    text: "We design custom rotas around your lifestyle. Perfect for students, creative schedules, and balancing families.",
    textWidth: "w-184",
  },
  {
    title: "GROWTH PATHWAYS",
    icon: "/brand/careers/value-chef-hat.svg",
    text: "70% of our Shift Leads and Pizzeria Managers started as Kitchen Crew. We fund professional food safety qualifications.",
    textWidth: "w-226",
  },
  {
    title: "FREE PIZZA PERKS",
    icon: "/brand/careers/value-pizza.svg",
    text: "A complimentary, fresh personal pizza of your choice during every single shift, plus a 50% discount for family dining.",
    textWidth: "w-196",
  },
];

/** Careers: Why Work With Us values (Figma 184:48). Anchor target for the hero "Our Culture" CTA. */
export function CareersValues() {
  return (
    <section
      id="culture"
      className="w-full scroll-mt-[80px] bg-white px-80 py-120 max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="careers-values-title"
    >
      <div className="mx-auto flex flex-col gap-56 max-lg:gap-[40px] max-sm:gap-[32px]">
        <header className="flex flex-col items-center gap-16 text-center leading-[normal] max-lg:gap-[12px]">
          <p className="w-full font-heading text-16 leading-[normal] font-extrabold text-pw-green-700 uppercase max-lg:text-[14px]">
            Pizzaway perks
          </p>
          <h2
            id="careers-values-title"
            className="w-full font-heading text-48 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(26px,6vw,42px)] max-lg:leading-[1.15] max-lg:wrap-break-word max-sm:text-[length:clamp(24px,7.5vw,32px)]"
          >
            Why Work With Us?
          </h2>
          <p className="w-700 max-w-full font-body text-16 leading-26 font-normal text-pw-muted max-lg:w-[600px] max-lg:text-[16px] max-lg:leading-[1.6] max-sm:w-full max-sm:text-[15px]">
            More than just fresh dough. We provide a workplace environment that prioritises growth,
            flexibility, and absolute transparency.
          </p>
        </header>

        <div className="flex items-start gap-24 max-lg:grid max-lg:items-stretch max-lg:gap-[16px] max-[900px]:grid-cols-1 min-[900px]:max-lg:grid-cols-3 sm:max-[900px]:mx-auto sm:max-[900px]:w-full sm:max-[900px]:max-w-[640px]">
          {VALUES.map((v) => (
            <article
              key={v.title}
              className="flex min-w-1 flex-[1_0_0] flex-col items-start gap-24 rounded-24 border-[1.5px] border-pw-line bg-pw-surface p-40 max-lg:min-w-0 max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[24px] max-sm:p-[24px]"
            >
              <span className="flex size-64 shrink-0 items-center justify-center rounded-32 bg-pw-green-100 max-lg:size-[56px] max-lg:rounded-[28px]">
                <img src={v.icon} alt="" width={28} height={28} />
              </span>
              <div className="flex flex-col items-start gap-8 max-lg:w-full max-lg:gap-[8px]">
                <h3 className="font-heading text-22 leading-[normal] font-extrabold whitespace-nowrap text-pw-ink max-lg:text-[20px] max-sm:whitespace-normal">
                  {v.title}
                </h3>
                <p
                  className={`${v.textWidth} max-w-full font-body text-14 leading-22 font-normal text-pw-muted max-lg:w-full max-lg:text-[14px] max-lg:leading-[1.6] max-sm:text-[15px]`}
                >
                  {v.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
