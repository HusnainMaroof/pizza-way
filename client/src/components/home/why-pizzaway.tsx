const PILLARS = [
  {
    title: "HOT.",
    icon: "/brand/icons/why-pillar-1.svg",
    text: "Our patented hotbox containment guarantees thermal optimization from the high-temp stone oven straight to your domestic threshold.",
  },
  {
    title: "FRESH.",
    icon: "/brand/icons/why-pillar-3.svg",
    text: "No frozen elements. Organic flour milled weekly, UK grown vegetables and selected cheeses prepared by our chefs every morning.",
  },
  {
    title: "DELICIOUS.",
    icon: "/brand/icons/why-pillar-2.svg",
    text: "Big bold flavor ratios with generous topping measurements optimized over thousands of customer reviews and tests.",
  },
];

/*
 * Tablet sub-ranges (exclusive, so no variant-order conflicts):
 * sm:max-[900px]  = 641-899px (1 column, icon beside text)
 * min-[900px]:max-lg = 900-1023px (3 columns)
 */
export function WhyPizzaway() {
  return (
    <section
      className="w-full bg-pw-green-900 px-80 py-120 max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="why-pizzaway-title"
    >
      <div className="mx-auto flex flex-col gap-80 max-lg:gap-[40px] max-sm:gap-[32px]">
        <header className="flex flex-col items-center gap-16 text-center leading-[normal] max-lg:gap-[12px]">
          <p className="font-heading text-16 leading-[normal] font-extrabold text-pw-green-500 uppercase max-lg:text-[14px]">
            The core formula
          </p>
          <h2
            id="why-pizzaway-title"
            className="font-heading text-48 leading-[normal] font-black text-white max-lg:text-[length:clamp(26px,6vw,42px)] max-lg:leading-[1.15] max-lg:wrap-break-word max-sm:text-[length:clamp(24px,7.5vw,32px)]"
          >
            Uncompromising Quality Controls
          </h2>
        </header>

        <div className="flex items-start gap-40 max-lg:grid max-lg:items-stretch max-lg:gap-[20px] max-[900px]:grid-cols-1 min-[900px]:max-lg:grid-cols-3 sm:max-[900px]:mx-auto sm:max-[900px]:w-full sm:max-[900px]:max-w-[640px] max-sm:gap-[16px]">
          {PILLARS.map((p) => (
            <article
              key={p.title}
              className="flex min-w-1 flex-[1_0_0] flex-col items-start gap-28 rounded-32 bg-pw-green-700 p-48 max-lg:min-w-0 max-lg:gap-[20px] max-lg:rounded-[24px] sm:max-[900px]:flex-row sm:max-[900px]:items-start sm:max-[900px]:p-[28px] min-[900px]:max-lg:p-[24px] max-sm:gap-[16px] max-sm:rounded-[20px] max-sm:px-[20px] max-sm:py-[24px]"
            >
              <span className="flex size-64 shrink-0 items-center justify-center rounded-16 bg-pw-green-900 max-lg:size-[56px] max-lg:rounded-[14px] max-sm:size-[52px]">
                <img src={p.icon} alt="" width={32} height={32} />
              </span>
              <div className="flex w-full flex-col gap-12 max-lg:gap-[8px]">
                <h3 className="font-heading text-40 leading-[normal] font-black text-white max-lg:text-[length:clamp(24px,3.4vw,30px)] max-lg:leading-[1.15] max-sm:text-[26px]">
                  {p.title}
                </h3>
                <p className="font-body text-15 leading-24 font-normal text-pw-green-100 max-lg:text-[15px] max-lg:leading-[1.6]">
                  {p.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
