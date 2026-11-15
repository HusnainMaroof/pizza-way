"use client";

import { CRUSTS, SAUCES, SIZES, TOPPING_CATEGORIES, TOPPING_PRICE, TOPPINGS } from "@/lib/byo-data";
import type { ToppingCategory } from "@/lib/byo-data";
import { useByoStore } from "@/store/byo-store";

// Shared look for every option (size card, sauce card, crust pill, topping chip).
// The real input is sr-only inside the <label>; the label reacts with has-[:checked] / has-[:focus-visible].
const OPTION =
  "group relative flex cursor-pointer select-none border-solid border-pw-line bg-pw-surface transition-colors duration-150 hover:border-pw-green-700 has-[:checked]:border-pw-green-700 has-[:checked]:bg-pw-green-100 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-pw-green-700";

const LEGEND =
  "w-full font-heading text-20 font-extrabold leading-[normal] text-pw-ink max-lg:text-[length:clamp(18px,2.6vw,22px)]";

const CATEGORY_COLOR: Record<ToppingCategory, string> = {
  vegetables: "text-pw-green-700",
  meats: "text-pw-red-600",
  seafood: "text-[#0277bd]",
};

const money = (n: number) => `£${n.toFixed(2)}`;

function RadioDot() {
  return (
    <span
      aria-hidden="true"
      className="flex size-16 shrink-0 items-center justify-center rounded-full border border-solid border-pw-line bg-white group-has-[:checked]:border-pw-green-700 max-lg:size-[18px]"
    >
      <span className="size-8 scale-0 rounded-full bg-pw-green-700 transition-transform duration-150 group-has-[:checked]:scale-100 max-lg:size-[9px]" />
    </span>
  );
}

function CheckBox() {
  return (
    <span
      aria-hidden="true"
      className="flex size-16 shrink-0 items-center justify-center rounded-[calc(4*var(--u))] border border-solid border-pw-line bg-white text-white group-has-[:checked]:border-pw-green-700 group-has-[:checked]:bg-pw-green-700 max-lg:size-[18px] max-lg:rounded-[4px]"
    >
      <svg
        viewBox="0 0 10 10"
        fill="none"
        className="size-10 opacity-0 group-has-[:checked]:opacity-100 max-lg:size-[11px]"
      >
        <path d="M1.5 5.2 4 7.6 8.5 2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function ByoConfigurator() {
  const size = useByoStore((s) => s.size);
  const sauce = useByoStore((s) => s.sauce);
  const crust = useByoStore((s) => s.crust);
  const toppings = useByoStore((s) => s.toppings);
  const setStep = useByoStore((s) => s.setStep);
  const setSize = useByoStore((s) => s.setSize);
  const setSauce = useByoStore((s) => s.setSauce);
  const setCrust = useByoStore((s) => s.setCrust);
  const toggleTopping = useByoStore((s) => s.toggleTopping);

  return (
    <div className="flex w-full flex-col items-start gap-24 max-lg:gap-[40px] max-sm:gap-[32px]">
      {/* Size */}
      <section id="byo-size" className="w-full scroll-mt-120 max-lg:scroll-mt-[96px]">
        <fieldset className="m-0 w-full min-w-0 border-0 p-0">
          <legend className={`${LEGEND} mb-12 max-lg:mb-[16px]`}>Choose Your Size</legend>
          <div className="grid w-full grid-cols-4 gap-16 max-lg:gap-[12px] max-sm:grid-cols-2">
            {SIZES.map((s) => (
              <label
                key={s.id}
                className={`${OPTION} min-w-0 flex-col items-start gap-10 rounded-16 border-[1.5px] p-20 max-lg:min-h-[44px] max-lg:gap-[6px] max-lg:rounded-[14px] max-lg:p-[16px]`}
              >
                <input
                  type="radio"
                  name="byo-size"
                  value={s.id}
                  checked={size === s.id}
                  onChange={() => {
                    setSize(s.id);
                    setStep(1);
                  }}
                  className="sr-only"
                />
                <span className="font-heading text-24 font-black leading-[normal] whitespace-nowrap text-pw-ink max-lg:text-[22px]">
                  {s.label}
                </span>
                <span className="font-body text-13 font-normal leading-[normal] whitespace-nowrap text-pw-muted group-has-[:checked]:text-pw-green-700 max-lg:text-[13px]">
                  from {money(s.price)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {/* Base: sauce + crust */}
      <section
        id="byo-base"
        className="flex w-full scroll-mt-120 flex-col items-start gap-24 max-lg:scroll-mt-[96px] max-lg:gap-[40px] max-sm:gap-[32px]"
      >
        <fieldset className="m-0 w-full min-w-0 border-0 p-0">
          <legend className={`${LEGEND} mb-12 max-lg:mb-[16px]`}>Choose Your Base Sauce</legend>
          <div className="flex w-full items-stretch gap-16 max-lg:gap-[12px] max-sm:flex-col">
            {SAUCES.map((s) => (
              <label
                key={s.id}
                className={`${OPTION} min-w-0 flex-[1_0_0] items-center gap-16 rounded-16 border-[1.5px] p-24 max-lg:min-h-[56px] max-lg:gap-[12px] max-lg:rounded-[14px] max-lg:p-[18px] max-sm:flex-auto`}
              >
                <input
                  type="radio"
                  name="byo-sauce"
                  value={s.id}
                  checked={sauce === s.id}
                  onChange={() => {
                    setSauce(s.id);
                    setStep(2);
                  }}
                  className="sr-only"
                />
                <RadioDot />
                <span className="font-heading text-16 font-extrabold leading-[normal] text-pw-ink max-lg:text-[16px]">
                  {s.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="m-0 w-full min-w-0 border-0 p-0">
          <legend className={`${LEGEND} mb-12 max-lg:mb-[16px]`}>Choose Your Crust</legend>
          <div className="flex w-full flex-wrap content-start items-start gap-12 max-lg:gap-[10px]">
            {CRUSTS.map((c) => (
              <label
                key={c.id}
                className={`${OPTION} shrink-0 items-center rounded-pill border px-24 py-12 max-lg:min-h-[44px] max-lg:px-[20px] max-lg:py-[10px]`}
              >
                <input
                  type="radio"
                  name="byo-crust"
                  value={c.id}
                  checked={crust === c.id}
                  onChange={() => {
                    setCrust(c.id);
                    setStep(2);
                  }}
                  className="sr-only"
                />
                <span className="font-heading text-14 font-extrabold leading-[normal] whitespace-nowrap text-pw-ink group-has-[:checked]:text-pw-green-900 max-lg:text-[14px]">
                  {c.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {/* Toppings */}
      <section id="byo-toppings" className="w-full scroll-mt-120 max-lg:scroll-mt-[96px]">
        <fieldset className="m-0 w-full min-w-0 border-0 p-0">
          <legend className={`${LEGEND} mb-16 max-lg:mb-[24px]`}>
            Add Toppings (from {money(TOPPING_PRICE)} each)
          </legend>
          <div className="flex w-full flex-col items-start gap-16 max-lg:gap-[24px]">
            {TOPPING_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                role="group"
                aria-labelledby={`byo-cat-${cat.id}`}
                className="flex w-full flex-col items-start gap-8 max-lg:gap-[12px]"
              >
                <p
                  id={`byo-cat-${cat.id}`}
                  className={`font-heading text-14 font-extrabold uppercase leading-[normal] whitespace-nowrap ${CATEGORY_COLOR[cat.id]} max-lg:text-[13px]`}
                >
                  {cat.label}
                </p>
                <div className="flex w-full flex-wrap content-start items-start gap-12 max-lg:gap-[8px]">
                  {TOPPINGS.filter((t) => t.category === cat.id).map((t) => (
                    <label
                      key={t.id}
                      className={`${OPTION} shrink-0 items-center gap-10 rounded-12 border px-11 py-12 max-lg:min-h-[44px] max-lg:gap-[8px] max-lg:rounded-[10px] max-lg:px-[12px] max-lg:py-[10px]`}
                    >
                      <input
                        type="checkbox"
                        name="byo-toppings"
                        value={t.id}
                        checked={toppings.includes(t.id)}
                        onChange={() => {
                          toggleTopping(t.id);
                          setStep(3);
                        }}
                        className="sr-only"
                      />
                      <CheckBox />
                      <span className="font-heading text-13 font-bold leading-[normal] whitespace-nowrap text-pw-ink max-lg:text-[14px]">
                        {t.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      </section>
    </div>
  );
}
