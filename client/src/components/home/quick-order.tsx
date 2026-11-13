import Image from "next/image";
import Link from "next/link";
import * as motion from "framer-motion/client";
import { MotionLink } from "@/components/home/motion-link";
import { DUR, EASE_OUT, RISE, STAGGER, VIEWPORT_ONCE } from "@/components/motion/tokens";

const CATEGORIES = [
  { icon: "pizza", title: "PIZZA", text: "Sourdough bases" },
  { icon: "circle-x", title: "SIDES", text: "Warm garlic bread & wedges" },
  { icon: "cup-soda", title: "DRINKS", text: "Ice cold refreshments" },
  { icon: "badge-percent", title: "DEALS", text: "Fintech price matching" },
  { icon: "package", title: "MEAL DEALS", text: "The ultimate gatherings" },
];

// Tablet: 3-col grid (6 tracks), 2nd row centered via the 4th card.
// Phone: 2-col grid, last card full width.
const CARD =
  "flex-[1_0_0] min-w-1 flex flex-col items-center justify-center gap-20 p-32 bg-pw-surface border-[1.5px] border-pw-line rounded-24 no-underline max-lg:col-span-2 max-lg:min-w-0 max-lg:py-[24px] max-lg:px-[16px] max-lg:gap-[16px] max-lg:nth-4:col-[2/span_2] max-sm:col-auto max-sm:py-[20px] max-sm:px-[12px] max-sm:gap-[12px] max-sm:nth-4:col-auto max-sm:last:col-[1/-1]";

// Motion only (no sizing): hover lift + shadow, tap press. CSS `translate`/`scale` compose with framer's `transform`.
const CARD_MOTION =
  "group transition-[translate,scale,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_14px_32px_rgba(3,53,19,0.10)] motion-safe:hover:-translate-y-[6px] motion-safe:active:scale-[0.98]";

const BUTTON_MOTION =
  "transition-[translate,scale] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-[2px] motion-safe:active:scale-[0.97]";

const REVEAL = {
  initial: { opacity: 0, y: RISE },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT_ONCE,
  transition: { duration: DUR.base, ease: EASE_OUT },
} as const;

const ITEM = {
  hidden: { opacity: 0, y: RISE },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
};

export function QuickOrder() {
  return (
    <section className="w-full bg-white">
      <div className="box-content mx-auto py-96 px-80 flex flex-col items-center gap-56 max-lg:py-[64px] max-lg:px-[40px] max-lg:gap-[40px] max-sm:py-[48px] max-sm:px-[20px] max-sm:gap-[32px]">
        <motion.div {...REVEAL} className="w-full flex flex-col items-center gap-12 text-center leading-[normal]">
          <p className="font-heading font-extrabold text-16 leading-[normal] text-pw-green-700 uppercase">
            EXPRESS TRACK
          </p>
          <h2 className="font-heading font-black text-44 leading-[normal] text-pw-ink max-sm:text-[length:clamp(26px,8vw,34px)]">
            What are you craving?
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          variants={{ hidden: {}, show: { transition: { staggerChildren: STAGGER, delayChildren: 0.05 } } }}
          className="w-full flex items-start gap-24 max-lg:grid max-lg:grid-cols-6 max-lg:gap-[16px] max-sm:grid-cols-2 max-sm:gap-[12px]"
        >
          {CATEGORIES.map((c) => (
            <MotionLink key={c.title} href="/menu" variants={ITEM} className={`${CARD} ${CARD_MOTION}`}>
              <span className="flex items-center justify-center size-80 rounded-40 bg-pw-green-100 transition-[scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:scale-[1.08]">
                <Image
                  src={`/brand/icons/${c.icon}.svg`}
                  alt=""
                  width={40}
                  height={40}
                  className="block transition-[rotate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:rotate-[6deg]"
                />
              </span>
              <span className="flex flex-col items-center gap-4 text-center whitespace-nowrap leading-[normal] max-lg:whitespace-normal">
                <span className="font-heading font-extrabold text-18 text-pw-ink max-sm:text-[16px]">
                  {c.title}
                </span>
                <span className="font-body font-normal text-13 text-pw-muted max-lg:text-[14px]">
                  {c.text}
                </span>
              </span>
            </MotionLink>
          ))}
        </motion.div>

        <Link
          href="/menu"
          className={`flex items-center justify-center py-14 px-28 rounded-pill bg-pw-green-700 font-heading font-extrabold text-14 leading-[normal] text-white uppercase no-underline whitespace-nowrap max-lg:min-h-[48px] max-lg:py-[12px] max-lg:px-[32px] max-lg:text-[15px] max-sm:box-border max-sm:w-full ${BUTTON_MOTION}`}
        >
          Start Your Order
        </Link>
      </div>
    </section>
  );
}
