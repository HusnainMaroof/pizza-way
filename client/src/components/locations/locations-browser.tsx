"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { STORES, storeMatches, type Store, type StoreService } from "./stores-data";

const SERVICE_LABEL: Record<StoreService, string> = {
  collection: "COLLECTION",
  delivery: "DELIVERY",
};

function parseMode(value: string | null): StoreService | null {
  return value === "collection" || value === "delivery" ? value : null;
}

/* Roads of the stylised map: centre (%), length (% of map width), angle. From Figma 97:2274. */
const ROADS = [
  "left-[52.5%] top-[37.3%] w-[93.1%] rotate-10",
  "left-[26.3%] top-[43.6%] w-[79.8%] rotate-100",
  "left-[45.4%] top-[55%] w-[66.5%] -rotate-15",
];

export function LocationsBrowser({ q: qRaw = "", mode: modeRaw = "" }: { q?: string; mode?: string }) {
  const q = qRaw.trim();
  const mode = parseMode(modeRaw);

  const stores = STORES.filter(
    (s) => storeMatches(s, q) && (!mode || s.services.includes(mode)),
  );

  const [selectedId, setSelectedId] = useState<string>(STORES[0].id);
  const selected = stores.find((s) => s.id === selectedId) ?? stores[0];

  const heading =
    stores.length === 0
      ? "No stores near your area"
      : `${stores.length} ${stores.length === 1 ? "Store" : "Stores"} near your area`;

  return (
    <section className="flex w-full items-start gap-48 bg-pw-surface px-80 py-96 max-lg:flex-col max-lg:gap-[32px] max-lg:px-[40px] max-lg:py-[56px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[40px]">
      {/* Map column */}
      <div className="flex min-w-0 flex-[1_0_0] flex-col items-start max-lg:w-full max-lg:flex-none">
        <div
          role="group"
          aria-label={
            selected ? `Map showing ${selected.name}` : "Map of Pizza Way stores"
          }
          className="relative h-700 w-full overflow-clip rounded-32 border-2 border-solid border-pw-line bg-[#e2ece8] max-lg:aspect-[752/700] max-lg:h-auto max-lg:max-h-[420px] max-sm:aspect-[4/3]"
        >
          {ROADS.map((pos) => (
            <div
              key={pos}
              aria-hidden
              className={`absolute h-12 -translate-x-1/2 -translate-y-1/2 bg-white max-sm:h-[6px] ${pos}`}
            />
          ))}

          {stores.map((store) => (
            <MapMarker
              key={store.id}
              store={store}
              active={store.id === selected?.id}
              onSelect={() => setSelectedId(store.id)}
            />
          ))}
        </div>
      </div>

      {/* Sidebar column */}
      <div className="flex w-480 shrink-0 flex-col items-start gap-24 max-lg:w-full max-lg:gap-[16px]">
        <h2 className="w-full font-heading text-24 font-black leading-[normal] text-pw-ink max-lg:text-[22px]">
          {heading}
        </h2>

        {stores.length === 0 ? (
          <p className="w-full rounded-24 border-[1.5px] border-solid border-pw-line bg-white p-32 font-body text-16 leading-[1.6] text-pw-muted max-lg:p-[24px] max-lg:text-[16px] max-sm:p-[20px]">
            No stores found near {q || "you"}. Try another postcode.
          </p>
        ) : (
          <ul className="flex w-full flex-col items-start gap-16 max-lg:gap-[12px]">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                active={store.id === selected?.id}
                onSelect={() => setSelectedId(store.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function MapMarker({
  store,
  active,
  onSelect,
}: {
  store: Store;
  active: boolean;
  onSelect: () => void;
}) {
  const label = `${store.area} (${store.distanceMiles}m)`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Select ${store.name}`}
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center before:absolute before:left-1/2 before:top-1/2 before:size-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] ${
        active ? "z-20" : "z-10"
      } ${store.mapClass}`}
    >
      {active ? (
        <span className="flex items-center gap-8 whitespace-nowrap rounded-pill border-2 border-solid border-white bg-pw-green-900 p-8 shadow-[0_4px_12px_rgba(2,77,26,0.25)]">
          <Image
            src="/brand/locations/map-pin-icon.svg"
            alt=""
            width={16}
            height={16}
            className="size-16 max-lg:size-[14px]"
          />
          <span className="font-heading text-12 font-extrabold leading-[normal] text-white">
            {label}
          </span>
        </span>
      ) : (
        <Image
          src="/brand/locations/map-pin.svg"
          alt=""
          width={36}
          height={40}
          className="h-40 w-36 max-lg:h-[34px] max-lg:w-[30px]"
        />
      )}
    </button>
  );
}

function StoreCard({
  store,
  active,
  onSelect,
}: {
  store: Store;
  active: boolean;
  onSelect: () => void;
}) {
  const sub = active ? "text-pw-green-100" : "text-pw-muted";

  return (
    <li
      className={`relative flex w-full flex-col items-start gap-20 rounded-24 border-[1.5px] border-solid p-32 transition-colors max-lg:gap-[16px] max-lg:p-[24px] max-sm:p-[20px] ${
        active ? "border-pw-green-700 bg-pw-green-900" : "border-pw-line bg-white hover:border-pw-green-700"
      }`}
    >
      {/* Stretched select button: whole card is clickable, ORDER NOW link sits above it. */}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        aria-label={`Select ${store.name}`}
        className="absolute inset-0 cursor-pointer rounded-24 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700"
      />

      <div className="pointer-events-none flex w-full flex-col items-start gap-4 leading-[normal]">
        <h3
          className={`font-heading text-22 font-extrabold max-lg:text-[20px] ${active ? "text-white" : "text-pw-ink"}`}
        >
          {store.name}
        </h3>
        <p className="flex flex-wrap items-center gap-x-8 font-body text-14 max-lg:text-[14px]">
          <span className="font-bold text-pw-green-500">{store.status}</span>
          <span aria-hidden className={sub}>
            •
          </span>
          <span className={sub}>{store.distanceMiles} Miles</span>
        </p>
      </div>

      <p className={`pointer-events-none font-body text-14 leading-22 max-lg:text-[14px] max-lg:leading-[22px] ${sub}`}>
        {store.address}, {store.postcode}
      </p>

      <ul className="pointer-events-none flex items-center gap-12" aria-label="Services">
        {store.services.map((s) => (
          <li
            key={s}
            className={`rounded-6 px-10 py-4 font-heading text-11 font-extrabold leading-[normal] text-white max-lg:text-[12px] ${
              s === "collection" ? "bg-pw-green-700" : "bg-pw-green-500"
            }`}
          >
            {SERVICE_LABEL[s]}
          </li>
        ))}
      </ul>

      <Link
        href="/menu"
        className="relative z-10 flex w-full items-center justify-center rounded-pill bg-pw-red-600 px-24 py-12 font-heading text-13 font-extrabold uppercase leading-[normal] text-white transition-opacity hover:opacity-90 max-lg:min-h-[44px] max-lg:text-[14px]"
      >
        Order Now
      </Link>
    </li>
  );
}
