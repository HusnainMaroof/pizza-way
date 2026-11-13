const VALUES = [
  {
    title: "QUALITY",
    icon: "/brand/about/value-chef-hat.svg",
    text: "We use only the freshest ingredients, organic stone-ground flour, and imported San Marzano DOP tomatoes.",
    textWidth: "w-317",
  },
  {
    title: "COMMUNITY",
    icon: "/brand/about/value-users.svg",
    text: "Supporting local neighbourhoods and UK farmers. Every ingredient traces back to a trusted regional supplier.",
    textWidth: "w-348",
  },
  {
    title: "SPEED",
    icon: "/brand/about/value-clock.svg",
    text: "From our stone-oven directly to your door in minutes, delivered hot using patented thermal container systems.",
    textWidth: "w-288",
  },
];

export function ValuesSection() {
  return (
    <section
      className="w-full bg-pw-surface px-80 py-96 max-lg:px-[40px] max-lg:py-[64px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="values-title"
    >
      <div className="mx-auto flex flex-col gap-56 max-lg:gap-[40px] max-sm:gap-[32px]">
        <header className="flex flex-col items-center gap-12 text-center leading-[normal] max-lg:gap-[12px]">
          <p className="w-full font-heading text-16 leading-[normal] font-extrabold text-pw-green-700 uppercase max-lg:text-[14px]">
            Core beliefs
          </p>
          <h2
            id="values-title"
            className="w-full font-heading text-44 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(26px,6vw,40px)] max-lg:leading-[1.15] max-lg:wrap-break-word max-sm:text-[length:clamp(24px,7.5vw,32px)]"
          >
            What drives our ovens.
          </h2>
        </header>

        <div className="flex items-start gap-24 max-lg:grid max-lg:items-stretch max-lg:gap-[16px] max-[900px]:grid-cols-1 min-[900px]:max-lg:grid-cols-3 sm:max-[900px]:mx-auto sm:max-[900px]:w-full sm:max-[900px]:max-w-[640px]">
          {VALUES.map((v) => (
            <article
              key={v.title}
              className="flex min-w-1 flex-[1_0_0] flex-col items-start gap-24 rounded-24 border-[1.5px] border-pw-line bg-white p-40 max-lg:min-w-0 max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[24px] max-sm:p-[24px]"
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
