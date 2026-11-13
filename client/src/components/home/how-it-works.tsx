const STEPS = [
  {
    num: "01",
    title: "CHOOSE IT.",
    text: "Select from our signature formulas or initiate custom pizza customisation with transparent pricing.",
  },
  {
    num: "02",
    title: "MAKE IT YOURS.",
    text: "Add premium modifiers, custom toppings, dipping sauces, and selected sides to complete your formula.",
  },
  {
    num: "03",
    title: "WE DELIVER.",
    text: "Watch live-tracking telemetry from hand-stretched prep inside the kitchen directly to your doorstep.",
  },
];

/*
 * Tablet sub-ranges (exclusive, so no variant-order conflicts):
 * sm:max-[900px]     = 641-899px (1 column, number beside text)
 * min-[900px]:max-lg = 900-1023px (3 columns, number on top)
 */
export function HowItWorks() {
  return (
    <section
      className="w-full bg-pw-red-600 px-80 py-120 [word-break:break-word] max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="how-it-works-title"
    >
      <div className="mx-auto flex flex-col items-center gap-80 max-lg:gap-[40px] max-sm:gap-[32px]">
        <header className="flex w-full flex-col items-center gap-16 text-center leading-[normal] text-pw-surface max-lg:gap-[12px]">
          <p className="font-heading text-16 leading-[normal] font-extrabold uppercase max-lg:text-[14px]">
            The system
          </p>
          <h2
            id="how-it-works-title"
            className="font-heading text-48 leading-[normal] font-black max-lg:text-[length:clamp(26px,6vw,42px)] max-lg:leading-[1.15] max-sm:text-[length:clamp(24px,7.5vw,32px)]"
          >
            Zero Friction. Absolute Clarity.
          </h2>
        </header>

        <ol className="flex w-full items-start gap-32 max-lg:grid max-lg:items-stretch max-lg:gap-[16px] max-[900px]:max-w-[640px] max-[900px]:grid-cols-1 min-[900px]:max-lg:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.num}
              className="flex min-w-1 flex-[1_0_0] flex-col items-start gap-24 rounded-24 border border-pw-line bg-pw-surface p-40 max-lg:min-w-0 max-lg:rounded-[20px] max-[900px]:flex-row sm:max-[900px]:gap-[20px] sm:max-[900px]:p-[28px] min-[900px]:max-lg:gap-[16px] min-[900px]:max-lg:p-[24px] max-sm:gap-[16px] max-sm:px-[20px] max-sm:py-[22px]"
            >
              <span
                className="font-heading text-56 leading-[normal] font-black whitespace-nowrap text-pw-red-600 max-lg:shrink-0 max-lg:text-[44px] max-lg:leading-none max-sm:text-[36px]"
                aria-hidden="true"
              >
                {s.num}
              </span>
              <div className="flex w-full flex-col gap-12 max-lg:min-w-0 max-lg:gap-[8px]">
                <h3 className="font-heading text-20 leading-[normal] font-extrabold text-pw-red-600 max-lg:text-[20px] max-sm:text-[18px]">
                  {s.title}
                </h3>
                <p className="font-body text-15 leading-24 font-normal text-pw-muted max-lg:text-[15px] max-lg:leading-[1.6]">
                  {s.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
