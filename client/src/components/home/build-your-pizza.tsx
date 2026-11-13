import Image from "next/image";
import Link from "next/link";
import * as motion from "framer-motion/client";
import { BuildPreviewParallax } from "@/components/home/build-preview-parallax";
import { DUR, EASE_OUT, STAGGER, VIEWPORT_ONCE } from "@/components/motion/tokens";

const steps = [
  { number: "01", title: "Choose Size", value: "12” Medium", active: true },
  { number: "02", title: "Choose Base Sauce", value: "San Marzano Plum Tomato" },
  { number: "03", title: "Add Premium Toppings", value: "Nduja, Wild Mushrooms (+£1.20)" },
  { number: "04", title: "Add Side Accompaniments", value: "Fries & Dip (+£2.50)" },
];

const stepBase =
  "flex items-center justify-between rounded-16 border p-20 max-lg:flex-wrap max-lg:gap-x-[16px] max-lg:gap-y-[6px] max-lg:px-[20px] max-lg:py-[16px] max-sm:flex-col max-sm:items-start max-sm:gap-x-[4px] max-sm:gap-y-[4px] max-sm:px-[16px] max-sm:py-[14px]";

// Motion presets (transform/opacity only). Columns slide in from the sides; the section clips x overflow meanwhile.
const SLIDE = (x: number) =>
  ({
    initial: { opacity: 0, x },
    whileInView: { opacity: 1, x: 0 },
    viewport: VIEWPORT_ONCE,
    transition: { duration: DUR.slow, ease: EASE_OUT },
  }) as const;
const STEPS = { hidden: {}, show: { transition: { staggerChildren: STAGGER, delayChildren: 0.2 } } };
const STEP = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
};
// One soft ring pulse on the active step, after the rows have landed.
const PULSE = {
  hidden: { opacity: 0, scale: 1 },
  show: { opacity: [0, 0.8, 0], scale: [1, 1.03], transition: { duration: 1.1, delay: 0.7, ease: EASE_OUT } },
};

export function BuildYourPizza() {
  return (
    <section
      className="w-full overflow-x-clip bg-white px-80 py-96 max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="build-your-pizza-title"
    >
      <div className="mx-auto flex items-center justify-center gap-80 max-lg:max-w-[640px] max-lg:flex-col max-lg:items-stretch max-lg:gap-[48px] max-sm:gap-[36px]">
        <motion.div
          {...SLIDE(-24)}
          className="flex w-600 shrink-0 flex-col gap-32 rounded-32 border-2 border-pw-line bg-pw-surface p-40 max-lg:w-full max-lg:shrink max-lg:gap-[24px] max-lg:p-[28px] max-sm:gap-[16px] max-sm:rounded-[24px] max-sm:p-[16px]"
          aria-hidden="true"
        >
          <div className="flex h-320 w-full items-center justify-center rounded-24 border border-pw-line bg-white max-lg:h-auto max-lg:overflow-hidden max-sm:rounded-[16px]">
            {/* Landscape 519x346 slot holding a portrait image rotated -90deg (as in Figma) */}
            <div className="relative flex h-346 w-519 shrink-0 items-center justify-center max-lg:aspect-[519/346] max-lg:h-auto max-lg:w-full max-lg:shrink">
              <div className="relative h-519 w-346 flex-none -rotate-90 overflow-hidden rounded-30 max-lg:h-[calc(100%*519/346)] max-lg:w-[calc(100%*346/519)] max-lg:rounded-[20px] max-sm:rounded-[14px]">
                <BuildPreviewParallax>
                  <Image
                    src="/brand/images/build-your-pizza-1.png"
                    alt=""
                    fill
                    sizes="(max-width: 1023px) 90vw, 36vw"
                    className="object-cover"
                  />
                </BuildPreviewParallax>
              </div>
            </div>
          </div>
          <div className="flex w-full items-center justify-between whitespace-nowrap leading-[normal] max-lg:flex-wrap max-lg:gap-x-[16px] max-lg:gap-y-[8px] max-lg:whitespace-normal">
            <div className="flex flex-col gap-4 font-heading font-extrabold">
              <p className="text-12 uppercase text-pw-green-700 max-sm:text-[12px]">CURRENT BUILD</p>
              <p className="text-18 text-pw-ink max-lg:text-[16px] max-sm:text-[14px]">
                Medium 12” • Classic Sourdough
              </p>
            </div>
            <p className="font-heading text-28 font-black text-pw-green-700 max-lg:text-[26px] max-sm:text-[22px]">
              £12.95
            </p>
          </div>
        </motion.div>

        <motion.div {...SLIDE(24)} className="flex w-580 shrink-0 flex-col items-start gap-40 max-lg:w-full max-lg:shrink max-lg:gap-[32px]">
          <div className="flex w-full flex-col gap-16 max-lg:gap-[12px]">
            <p className="font-heading text-16 font-extrabold uppercase leading-[normal] text-pw-green-700 max-lg:text-[14px] max-sm:text-[12px]">
              ULTIMATE CUSTOMISATION
            </p>
            <h2
              id="build-your-pizza-title"
              className="font-heading text-48 font-black leading-[normal] text-pw-ink max-lg:text-[length:clamp(30px,5vw,44px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(28px,8.5vw,38px)]"
            >
              Made Your Way.
            </h2>
            <p className="font-body text-16 font-normal leading-26 text-pw-muted max-lg:text-[16px] max-lg:leading-[1.6] max-sm:text-[15px]">
              Our precision-engineered digital builder allows you to select every single
              variable of your culinary formula.
            </p>
          </div>

          <motion.ol
            variants={STEPS}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT_ONCE}
            className="flex w-full flex-col gap-16 whitespace-nowrap leading-[normal] max-lg:gap-[12px] max-lg:whitespace-normal">
            {steps.map((step) => (
              <motion.li
                key={step.number}
                variants={STEP}
                className={`relative ${stepBase} ${
                  step.active ? "border-pw-green-700 bg-pw-green-100" : "border-pw-line bg-pw-surface"
                }`}
              >
                <span className="flex items-center gap-16 font-heading text-16 max-lg:gap-[12px] max-lg:text-[16px] max-sm:text-[15px]">
                  <span
                    className={`font-black ${step.active ? "text-pw-green-700" : "text-pw-muted"}`}
                  >
                    {step.number}
                  </span>
                  <span className="font-extrabold text-pw-ink">{step.title}</span>
                </span>
                <span
                  className={`font-body text-14 font-medium max-lg:text-[14px] max-sm:pl-[32px] ${
                    step.active ? "text-pw-green-700" : "text-pw-muted"
                  }`}
                >
                  {step.value}
                </span>
                {step.active && (
                  <motion.span
                    variants={PULSE}
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-[1px] rounded-16 ring-2 ring-pw-green-700/60"
                  />
                )}
              </motion.li>
            ))}
          </motion.ol>

          <Link
            href="/build-your-pizza"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-pw-green-700 transition-[translate,scale] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-[2px] motion-safe:active:scale-[0.97] px-36 py-18 font-heading text-16 font-extrabold uppercase leading-[normal] text-white no-underline max-lg:min-h-[48px] max-lg:px-[32px] max-lg:py-[14px] max-lg:text-[15px] max-sm:w-full max-sm:whitespace-normal max-sm:px-[20px] max-sm:py-[14px] max-sm:text-center"
          >
            Start Building Your Pizza
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
