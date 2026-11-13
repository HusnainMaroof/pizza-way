import Link from "next/link";

type Step = { n: number; label: string; short: string; state: "done" | "active" | "todo"; href?: string };

const STEPS: Step[] = [
  { n: 1, label: "Basket", short: "Basket", state: "done", href: "/cart" },
  { n: 2, label: "Delivery Details", short: "Details", state: "active" },
  { n: 3, label: "Payment", short: "Payment", state: "todo" },
  { n: 4, label: "Confirmation", short: "Confirm", state: "todo" },
];

const BADGE =
  "flex size-24 shrink-0 items-center justify-center rounded-12 font-heading text-12 leading-[normal] font-extrabold max-lg:size-[24px] max-lg:rounded-pill max-lg:text-[12px]";
const LABEL = "font-heading text-15 leading-[normal] font-bold whitespace-nowrap max-lg:text-[15px] max-sm:text-[13px]";

/** Checkout progress ribbon (Figma 97:1684). Static: step 2 is current. */
export function CheckoutRibbon() {
  return (
    <nav
      aria-label="Checkout progress"
      className="flex w-full items-center justify-center border-0 border-b-[1.5px] border-solid border-pw-line bg-white px-80 py-32 max-lg:px-[40px] max-lg:py-[24px] max-sm:px-[20px] max-sm:py-[16px]"
    >
      <ol className="m-0 flex min-w-0 list-none items-center justify-center gap-24 p-0 max-lg:gap-[16px] max-sm:w-full max-sm:justify-between max-sm:gap-[4px]">
        {STEPS.map((s, i) => {
          const isGreen = s.state !== "todo";
          const badge = (
            <span
              aria-hidden="true"
              className={`${BADGE} ${isGreen ? "bg-pw-green-700 text-white" : "bg-pw-line text-pw-muted"}`}
            >
              {s.state === "done" ? "✓" : s.n}
            </span>
          );
          const text = (
            <>
              <span className="max-sm:hidden">{s.label}</span>
              <span className="hidden max-sm:inline">{s.short}</span>
            </>
          );
          const status = s.state === "done" ? " (completed)" : s.state === "todo" ? " (not started)" : "";
          return (
            <li key={s.n} className="flex min-w-0 items-center gap-24 max-lg:gap-[16px] max-sm:gap-[6px]">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`block h-[2px] w-60 shrink-0 max-lg:w-[40px] max-sm:w-[10px] ${
                    STEPS[i - 1].state === "done" ? "bg-pw-green-700" : "bg-pw-line"
                  }`}
                />
              )}
              {s.href ? (
                <Link
                  href={s.href}
                  className={`flex items-center gap-8 rounded-pill text-pw-green-700 no-underline outline-none hover:underline focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-2 max-lg:min-h-[44px] max-lg:gap-[8px] max-sm:gap-[6px] ${LABEL}`}
                >
                  {badge}
                  <span className="sr-only">Step {s.n}: </span>
                  {text}
                  <span className="sr-only">{status}</span>
                </Link>
              ) : (
                <span
                  aria-current={s.state === "active" ? "step" : undefined}
                  className={`flex items-center gap-8 max-lg:min-h-[44px] max-lg:gap-[8px] max-sm:gap-[6px] ${LABEL} ${
                    isGreen ? "text-pw-green-700" : "text-pw-muted"
                  }`}
                >
                  {badge}
                  <span className="sr-only">Step {s.n}: </span>
                  {/* Phones: only the active step keeps its text label. */}
                  <span className={s.state === "active" ? "" : "max-sm:sr-only"}>{text}</span>
                  <span className="sr-only">{status}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
