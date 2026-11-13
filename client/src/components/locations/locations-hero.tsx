"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Mode = "delivery" | "collection";

const TOGGLE =
  "flex-[1_0_0] min-w-1 py-12 px-0 border-0 rounded-pill cursor-pointer font-heading font-extrabold text-14 leading-[normal] whitespace-nowrap max-lg:min-h-[44px] max-lg:py-[10px] max-lg:text-[14px]";

/** Locations hero (Figma 97:2255). Postcode search; pushes ?q=&mode= to /locations. */
export function LocationsHero({ initialQ = "", initialMode = "" }: { initialQ?: string; initialMode?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode === "collection" ? "collection" : "delivery");
  const [postcode, setPostcode] = useState(initialQ);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = postcode.trim();
    router.push(q ? `/locations?q=${encodeURIComponent(q)}&mode=${mode}` : "/locations");
  }

  return (
    <section
      className="flex w-full flex-col items-center gap-40 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#03872d_0%,#036a24_50%,#024d1a_100%)] px-80 py-96 max-lg:gap-[32px] max-lg:px-[40px] max-lg:py-[64px] max-sm:gap-[28px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="locations-hero-title"
    >
      <div className="flex w-full flex-col items-center gap-16 text-center uppercase leading-[normal] wrap-break-word max-sm:gap-[12px]">
        <p className="w-full font-heading text-14 font-extrabold text-pw-green-500 max-sm:text-[12px]">
          Mapping coverage
        </p>
        <h1
          id="locations-hero-title"
          className="w-full font-heading text-56 font-black leading-[normal] text-white max-lg:text-[length:clamp(36px,6vw,52px)] max-sm:text-[length:clamp(28px,9vw,40px)]"
        >
          FIND YOUR PIZZA.
        </h1>
      </div>

      <div className="flex w-680 max-w-full flex-col gap-24 rounded-28 bg-pw-green-900 p-32 max-lg:w-full max-lg:max-w-[680px] max-lg:gap-[20px] max-lg:p-[24px] max-sm:max-w-none max-sm:gap-[16px] max-sm:rounded-[20px] max-sm:p-[16px]">
        <div className="flex w-full gap-4 rounded-pill bg-pw-green-700 p-4" role="radiogroup" aria-label="Order type">
          {(["delivery", "collection"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              className={`${TOGGLE} ${mode === m ? "bg-white text-pw-green-700" : "bg-transparent text-pw-green-100"}`}
              onClick={() => setMode(m)}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <form
          role="search"
          className="m-0 flex w-full items-center gap-16 rounded-pill bg-white py-8 pl-24 pr-8 max-lg:gap-[12px] max-lg:py-[6px] max-lg:pl-[20px] max-lg:pr-[6px] max-sm:flex-wrap max-sm:gap-[8px_12px] max-sm:rounded-[24px] max-sm:pl-[16px]"
          onSubmit={handleSubmit}
        >
          <Image
            src="/brand/locations/map-pin.svg"
            alt=""
            width={20}
            height={20}
            className="block shrink-0"
          />
          <input
            className="min-w-1 flex-[1_0_0] border-0 bg-transparent p-0 font-body text-15 font-normal leading-[normal] text-pw-ink outline-none placeholder:text-pw-muted placeholder:opacity-100 max-lg:min-h-[44px] max-lg:text-[16px] max-sm:min-w-0 max-sm:flex-[1_1_0]"
            type="text"
            name="q"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="Enter your postcode (e.g. SW1A 1AA)"
            aria-label="Postcode"
            autoComplete="postal-code"
          />
          <button
            type="submit"
            className="shrink-0 cursor-pointer whitespace-nowrap rounded-pill border-0 bg-pw-red-600 px-28 py-14 font-heading text-14 font-extrabold uppercase leading-[normal] text-white max-lg:min-h-[44px] max-lg:px-[24px] max-lg:py-[12px] max-lg:text-[14px] max-sm:ml-[-10px] max-sm:min-h-[48px] max-sm:flex-[1_0_100%]"
          >
            Find
          </button>
        </form>
      </div>
    </section>
  );
}
