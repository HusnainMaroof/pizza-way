"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/cart-store";
import { DUR, EASE_OUT, RISE, SPRING_SNAPPY, SPRING_SOFT, STAGGER, VIEWPORT_ONCE } from "@/components/motion/tokens";
import { AddedLabel, PlusOneChip } from "./pizza-section";

type SideItem = {
  name: string;
  price: string;
};

const sides: SideItem[] = [
  { name: "Garlic Bread (4PCS)", price: "£3.50" },
  { name: "Potato Wedges", price: "£3.50" },
  { name: "Onion Rings (6PCS)", price: "£3.50" },
  { name: "Korean BBQ Wings (4PCS)", price: "£4.95" },
  { name: "Soft Drinks", price: "£1.50" },
  { name: "Garlic & Herb Sauce Dip", price: "£0.50" },
];

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER } },
};

const itemVariants = {
  hidden: { opacity: 0, y: RISE },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
};

/** QUICK ADD button: tap scale, label cross-fade to "Added ✓" and a one-shot "+1" chip per add. */
function QuickAddButton({ item, added, onAdd }: { item: SideItem; added: boolean; onAdd: () => void }) {
  const [bursts, setBursts] = useState<number[]>([]);
  const burstId = useRef(0);

  return (
    <motion.button
      type="button"
      aria-label={`Quick add ${item.name}`}
      onClick={() => {
        onAdd();
        burstId.current += 1;
        const id = burstId.current;
        setBursts((b) => [...b, id]);
      }}
      whileTap={{ scale: 0.97 }}
      transition={SPRING_SNAPPY}
      className="relative inline-flex w-full cursor-pointer items-center justify-center whitespace-nowrap rounded-pill bg-white px-20 py-10 font-heading text-13 font-extrabold uppercase leading-[normal] text-pw-ink max-lg:min-h-[44px] max-lg:px-[22px] max-lg:py-[10px] max-lg:text-[13px]"
    >
      <AddedLabel added={added} idle="Quick Add" />
      {bursts.map((id) => (
        <PlusOneChip
          key={id}
          onDone={() => setBursts((b) => b.filter((x) => x !== id))}
          className="pointer-events-none absolute -top-[14px] right-[20px] rounded-pill bg-pw-green-500 px-[10px] py-[4px] font-heading text-[12px] font-extrabold leading-[normal] text-pw-ink shadow-[0_6px_14px_-6px_rgba(0,0,0,0.35)]"
        />
      ))}
    </motion.button>
  );
}

export function SidesSection() {
  const addToCart = useCartStore((st) => st.add);
  const [addedName, setAddedName] = useState<string | null>(null);
  return (
    <section
      className="w-full bg-pw-green-700 px-80 pb-120 pt-96 max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="sides-section-title"
    >
      <div className="flex flex-col gap-64 max-lg:gap-[40px] max-sm:gap-[32px]">
        <motion.div
          initial={{ opacity: 0, y: RISE }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          className="flex w-full flex-col items-center gap-12 text-center leading-[normal] max-lg:gap-[10px]"
        >
          <p className="w-full font-heading text-16 font-extrabold uppercase text-pw-green-500 max-sm:text-[12px]">
            ACCOMPANIMENTS
          </p>
          <h2
            id="sides-section-title"
            className="w-full font-heading text-48 font-black leading-[normal] text-white max-lg:text-[length:clamp(32px,5vw,44px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(28px,8.5vw,40px)]"
          >
            SIDES &amp; EXTRAS
          </h2>
        </motion.div>

        <motion.ul
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          className="grid grid-cols-3 gap-24 max-lg:grid-cols-2 max-lg:gap-[20px] max-sm:grid-cols-1 max-sm:gap-[16px]"
        >
          {sides.map((item) => (
            <motion.li
              key={item.name}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={SPRING_SOFT}
              className="flex min-w-0 flex-col items-start gap-20 rounded-24 bg-pw-green-900 p-32 max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[24px] max-sm:p-[20px]"
            >
              <div className="flex w-full items-center justify-between gap-12 whitespace-nowrap leading-[normal] max-lg:gap-[12px]">
                <h3 className="min-w-0 font-heading text-20 font-extrabold leading-[normal] text-white max-lg:whitespace-normal max-lg:text-[18px] max-lg:leading-[1.2]">
                  {item.name}
                </h3>
                <p className="shrink-0 font-heading text-18 font-black text-pw-green-500 max-lg:text-[17px]">
                  {item.price}
                </p>
              </div>
              <QuickAddButton
                item={item}
                added={addedName === item.name}
                onAdd={() => {
                  addToCart({
                    id: `side-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                    name: item.name,
                    price: Number(item.price.replace(/[^0-9.]/g, "")),
                    meta: "Side",
                  });
                  setAddedName(item.name);
                  setTimeout(() => setAddedName((n) => (n === item.name ? null : n)), 1600);
                }}
              />
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
