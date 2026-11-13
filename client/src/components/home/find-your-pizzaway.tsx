"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { DUR, EASE_OUT, RISE, SPRING_SNAPPY, VIEWPORT_ONCE } from "@/components/motion/tokens";

type Mode = "delivery" | "collection";

const TOGGLE =
  "flex-[1_0_0] min-w-1 py-12 px-0 border-0 rounded-pill cursor-pointer font-heading font-extrabold text-14 leading-[normal] whitespace-nowrap max-lg:min-h-[44px] max-lg:py-[10px] max-lg:text-[14px]";

const REVEAL = {
  initial: { opacity: 0, y: RISE },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT_ONCE,
};

/** Section 9: Find Your Pizzaway (Figma 97:289). Postcode search panel, no backend yet. */
export function FindYourPizzaway() {
  const [mode, setMode] = useState<Mode>("delivery");
  const [postcode, setPostcode] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <section
      className="w-full bg-pw-green-700 py-120 px-80 max-lg:py-[80px] max-lg:px-[40px] max-sm:py-[64px] max-sm:px-[20px]"
      aria-labelledby="find-your-pizza-title"
    >
      <div className="mx-auto flex flex-col items-center gap-48 max-lg:gap-[32px] max-sm:gap-[28px]">
        <motion.div
          {...REVEAL}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          className="w-full flex flex-col items-center gap-16 text-center leading-[normal]"
        >
          <p className="font-heading font-extrabold text-16 uppercase text-pw-green-500 max-lg:text-[14px]">
            Mapping coverage
          </p>
          <h2
            id="find-your-pizza-title"
            className="font-heading font-black text-48 leading-[normal] text-white max-lg:text-[length:clamp(32px,5vw,44px)] max-lg:wrap-break-word max-sm:text-[length:clamp(28px,8vw,36px)]"
          >
            FIND YOUR PIZZA.
          </h2>
        </motion.div>

        <motion.div
          {...REVEAL}
          transition={{ duration: DUR.base, ease: EASE_OUT, delay: 0.08 }}
          className="w-680 max-w-full flex flex-col gap-24 p-32 bg-pw-green-900 rounded-28 max-lg:w-full max-lg:max-w-[680px] max-lg:gap-[20px] max-lg:p-[24px] max-sm:max-w-none max-sm:gap-[16px] max-sm:p-[16px] max-sm:rounded-[20px]"
        >
          <div className="w-full flex gap-4 p-4 bg-pw-green-700 rounded-pill" role="radiogroup" aria-label="Order type">
            {(["delivery", "collection"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                className={`${TOGGLE} relative bg-transparent transition-colors duration-200 ${mode === m ? "text-pw-green-700" : "text-pw-green-100"}`}
                onClick={() => setMode(m)}
              >
                {/* Sliding white pill: one shared element that moves between the options. */}
                {mode === m && (
                  <motion.span
                    layoutId="find-mode-pill"
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 rounded-pill bg-white"
                    aria-hidden="true"
                  />
                )}
                <span className="relative">{m.toUpperCase()}</span>
              </button>
            ))}
          </div>

          <form
            className="group w-full flex items-center gap-16 m-0 py-8 pr-8 pl-24 bg-white rounded-pill max-lg:gap-[12px] max-lg:py-[6px] max-lg:pr-[6px] max-lg:pl-[20px] max-sm:flex-wrap max-sm:gap-[8px_12px] max-sm:pl-[16px] max-sm:rounded-[24px]"
            onSubmit={handleSubmit}
          >
            <Image
              src="/brand/icons/find-location.svg"
              alt=""
              width={20}
              height={20}
              className="shrink-0 block transition-[translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:-translate-y-[2px] motion-safe:group-focus-within:-translate-y-[2px]"
            />
            <input
              className="flex-[1_0_0] min-w-1 p-0 border-0 outline-none bg-transparent font-body font-normal text-15 leading-[normal] text-pw-ink placeholder:text-pw-muted placeholder:opacity-100 max-lg:min-h-[44px] max-lg:text-[16px] max-sm:flex-[1_1_0] max-sm:min-w-0"
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="Enter your postcode (e.g. SW1A 1AA)"
              aria-label="Postcode"
              autoComplete="postal-code"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_SNAPPY}
              className="shrink-0 py-14 px-28 border-0 rounded-pill bg-pw-red-600 cursor-pointer font-heading font-extrabold text-14 leading-[normal] uppercase whitespace-nowrap text-white max-lg:min-h-[44px] max-lg:py-[12px] max-lg:px-[24px] max-lg:text-[14px] max-sm:flex-[1_0_100%] max-sm:min-h-[48px] max-sm:ml-[-10px]"
            >
              Find my store
            </motion.button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
