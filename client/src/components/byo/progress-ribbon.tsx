"use client";

import { STEPS } from "@/lib/byo-data";
import { useByoStore } from "@/store/byo-store";

export function ProgressRibbon() {
  const step = useByoStore((s) => s.step);
  const setStep = useByoStore((s) => s.setStep);

  const go = (id: (typeof STEPS)[number]["id"], anchor: string) => {
    setStep(id);
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Build your pizza steps"
      className="w-full overflow-x-auto border-b-[1.5px] border-pw-line bg-white [scrollbar-width:none]"
    >
      <ol className="flex min-w-full items-center justify-between gap-16 px-80 py-20 max-lg:w-max max-lg:gap-[24px] max-lg:px-[40px] max-lg:py-[12px] max-sm:min-w-full max-sm:w-full max-sm:gap-[4px] max-sm:px-[12px] max-sm:py-[8px]">
        {STEPS.map((s) => {
          const active = s.id === step;
          return (
            <li key={s.id} className="shrink-0 max-sm:min-w-0 max-sm:flex-1">
              <button
                type="button"
                onClick={() => go(s.id, s.anchor)}
                aria-current={active ? "step" : undefined}
                className="flex cursor-pointer items-center gap-12 rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[44px] max-lg:gap-[10px] max-sm:w-full max-sm:flex-col max-sm:justify-center max-sm:gap-[4px] max-sm:px-[4px]"
              >
                <span
                  className={`flex size-28 shrink-0 items-center justify-center rounded-pill font-heading text-12 font-extrabold leading-[normal] max-lg:size-[28px] max-lg:text-[12px] max-sm:size-[24px] ${
                    active ? "bg-pw-green-700 text-white" : "bg-pw-line text-pw-muted"
                  }`}
                >
                  {s.id}
                </span>
                <span
                  className={`whitespace-nowrap font-heading text-15 leading-[normal] max-lg:text-[15px] max-sm:text-[12px] ${
                    active ? "font-extrabold text-pw-green-700" : "font-medium text-pw-muted"
                  }`}
                >
                  <span className="max-sm:sr-only">Step {s.id} </span>
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
