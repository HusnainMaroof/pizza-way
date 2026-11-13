"use client";

import { useState } from "react";
import { PizzaSection, type PizzaTag } from "./pizza-section";
import { SidesSection } from "./sides-section";

type FilterId = "all" | PizzaTag | "sides" | "drinks";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "classic", label: "Classic" },
  { id: "meat", label: "Meat" },
  { id: "chicken", label: "Chicken" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "spicy", label: "Spicy" },
  { id: "sides", label: "Sides" },
  { id: "drinks", label: "Drinks" },
];

export function MenuBrowser() {
  const [filter, setFilter] = useState<FilterId>("all");

  const showSides = filter === "all" || filter === "sides";
  const showPizzas = filter !== "sides" && filter !== "drinks";
  const pizzaTag = filter === "all" || !showPizzas ? undefined : (filter as PizzaTag);

  return (
    <>
      <nav
        aria-label="Menu filters"
        className="flex w-full items-start border-b-[1.5px] border-solid border-pw-line bg-white px-80 py-24 max-lg:px-[40px] max-lg:py-[16px] max-sm:px-0 max-sm:py-[12px]"
      >
        <div className="flex min-w-0 flex-[1_0_0] flex-wrap content-start items-start gap-12 max-lg:gap-[10px] max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:px-[20px] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.id)}
                className={`inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-pill border border-solid px-24 py-11 font-heading text-14 font-extrabold leading-[normal] max-lg:min-h-[44px] max-lg:px-[20px] max-lg:py-[10px] max-lg:text-[14px] ${
                  active
                    ? "border-pw-green-700 bg-pw-green-700 text-white"
                    : "border-pw-line bg-pw-surface text-pw-ink"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </nav>

      {showPizzas && <PizzaSection tag={pizzaTag} />}
      {showSides && <SidesSection />}

      {filter === "drinks" && (
        <section className="flex w-full flex-col items-center gap-12 bg-white px-80 py-120 text-center max-lg:gap-[10px] max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px]">
          <h2 className="font-heading text-32 font-black leading-[normal] text-pw-ink max-lg:text-[26px]">
            Drinks are coming soon
          </h2>
          <p className="font-body text-16 font-normal leading-[1.6] text-pw-muted max-lg:text-[16px]">
            We are still filling the fridge. Check back shortly.
          </p>
        </section>
      )}
    </>
  );
}
