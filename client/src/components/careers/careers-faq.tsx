"use client";

import Link from "next/link";
import { useState } from "react";

type Position = {
  id: string;
  title: string;
  meta: string;
  description: string;
};

const POSITIONS: Position[] = [
  {
    id: "kitchen-team-member",
    title: "Kitchen Team Member",
    meta: "London Soho • Full-time / Part-time",
    description:
      "Master the art of Neapolitan pizza making. You'll stretch 48-hour fermented sourdough, arrange premium ingredients with precision, and operate high-temp stone ovens. No prior experience required, full hands-on training provided.",
  },
  {
    id: "delivery-driver",
    title: "Delivery Driver (Scooter / E-Bike)",
    meta: "Manchester Central • Flexible Shift Work",
    description:
      "Deliver hot stone-baked pizzas across the city on scooter or e-bike. Flexible shifts that fit around your life, with live-tracked routes and full safety kit provided.",
  },
  {
    id: "store-manager",
    title: "Store Manager",
    meta: "Leeds Briggate • Full-time Executive",
    description:
      "Lead your pizzeria team day to day: rotas, stock, quality and service. You'll coach the crew, own the branch numbers and keep every pizza on brand.",
  },
  {
    id: "marketing-coordinator",
    title: "Marketing Coordinator",
    meta: "London HQ (Hybrid) • Full-time",
    description:
      "Plan and run local and national campaigns, social content and in-store promotions with our brand team, and track what drives real orders.",
  },
  {
    id: "customer-service",
    title: "Customer Service Representative",
    meta: "London HQ / Remote • Part-time",
    description:
      "Help customers by chat, email and phone with orders, deliveries and feedback. Calm, friendly problem-solving is the job; full training provided.",
  },
];

const APPLY =
  "inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-pw-red-600 px-24 py-10 font-heading text-14 leading-[normal] font-extrabold text-white uppercase no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[44px] max-lg:px-[24px] max-lg:py-[12px] max-lg:text-[14px]";

/** Careers: Explore Our Positions accordion (Figma 184:75). */
export function CareersFaq() {
  const [openId, setOpenId] = useState<string | null>(POSITIONS[0].id);

  return (
    <section
      id="open-roles"
      className="flex w-full scroll-mt-[80px] flex-col items-center gap-48 bg-pw-surface p-96 [word-break:break-word] max-lg:gap-[36px] max-lg:px-[40px] max-lg:py-[64px] max-sm:gap-[28px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="careers-positions-title"
    >
      <header className="flex w-full flex-col items-center gap-16 text-center leading-[normal] max-lg:gap-[12px]">
        <p className="font-heading text-16 leading-[normal] font-extrabold text-pw-green-700 uppercase max-lg:text-[14px]">
          CURRENT OPENINGS
        </p>
        <h2
          id="careers-positions-title"
          className="font-heading text-48 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(26px,6vw,42px)] max-lg:leading-[1.15] max-sm:text-[length:clamp(24px,7.5vw,32px)]"
        >
          Explore Our Positions
        </h2>
        <p className="w-700 max-w-full font-body text-16 leading-26 font-normal text-pw-muted max-lg:w-[600px] max-lg:text-[16px] max-lg:leading-[1.6] max-sm:w-full max-sm:text-[15px]">
          Whether you are a seasoned dough-stretcher, a prompt-delivery driver, or an operations master, we have a
          place for you.
        </p>
      </header>

      <div className="flex w-880 max-w-full flex-col items-start gap-16 max-lg:w-full max-lg:max-w-[720px] max-lg:gap-[12px]">
        {POSITIONS.map((p) => {
          const open = openId === p.id;
          const buttonId = `position-${p.id}-button`;
          const panelId = `position-${p.id}-panel`;
          return (
            <div
              key={p.id}
              className="relative w-full rounded-16 border border-solid border-pw-line bg-white max-lg:rounded-[14px]"
            >
              <h3 className="font-heading">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenId(open ? null : p.id)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-16 rounded-16 px-24 pt-24 text-left transition-[padding] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[56px] max-lg:gap-[12px] max-lg:rounded-[14px] max-lg:px-[20px] max-lg:pt-[18px] ${
                    open ? "pb-12 max-lg:pb-[10px]" : "pb-24 max-lg:pb-[18px]"
                  }`}
                >
                  <span
                    className={`flex min-w-0 flex-1 flex-col items-start gap-4 leading-[normal] max-lg:gap-[4px] ${
                      open ? "sm:pr-112 sm:max-lg:pr-[116px]" : ""
                    }`}
                  >
                    <span className="font-heading text-20 leading-[normal] font-extrabold text-pw-ink max-lg:text-[18px] max-sm:text-[17px]">
                      {p.title}
                    </span>
                    <span className="font-body text-14 leading-[normal] font-medium text-pw-green-700 max-lg:text-[14px]">
                      {p.meta}
                    </span>
                  </span>
                  <img
                    src={open ? "/brand/careers/positions-chevron-up.svg" : "/brand/careers/positions-chevron-down.svg"}
                    alt=""
                    width={16}
                    height={16}
                    className="size-16 shrink-0 max-lg:size-[16px]"
                  />
                </button>
              </h3>

              {/* Apply sits beside the toggle (not nested in it). Desktop/tablet: in the header row. */}
              <Link
                href={`/careers/open-roles?role=${p.id}`}
                aria-label={`Apply for ${p.title}`}
                className={`${APPLY} absolute top-28 right-56 transition-opacity duration-300 max-lg:top-[18px] max-lg:right-[48px] max-sm:hidden ${
                  open ? "visible opacity-100" : "invisible opacity-0"
                }`}
              >
                Apply
              </Link>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0 overflow-hidden" inert={!open}>
                  <p className="px-24 pb-24 font-body text-14 leading-22 font-normal text-pw-muted max-lg:px-[20px] max-lg:pb-[18px] max-lg:text-[14px] max-lg:leading-[1.6] max-sm:pb-[16px] max-sm:text-[15px]">
                    {p.description}
                  </p>
                  {/* Phone: Apply moves below the description, full width. */}
                  <div className="hidden max-sm:block max-sm:px-[20px] max-sm:pb-[18px]">
                    <Link
                      href={`/careers/open-roles?role=${p.id}`}
                      aria-label={`Apply for ${p.title}`}
                      className={`${APPLY} w-full`}
                    >
                      Apply
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
