import Image from "next/image";

/* Stylised map from Figma 97:2131 (832 x 400). Positions are % of the map box: centre (left/top), length (w), angle. */
const ROADS = [
  "left-[32%] top-[63.9%] w-[60.1%] rotate-25",
  "left-[2.8%] top-[80.5%] w-[72.1%] rotate-115",
  "left-[59.7%] top-[41.3%] w-[48.1%] -rotate-10",
];

/* Route: store -> junction with the main road -> destination. */
const ROUTE = [
  "left-[29.8%] top-[45.9%] w-[24.5%] rotate-60",
  "left-[45.1%] top-[76.5%] w-[19.9%] rotate-25",
];

/* Rider positions along the route, picked by Math.floor(progress * 5). Written out in full for Tailwind. */
const RIDER_POSITIONS = [
  "left-[24.8%] top-[28.3%]",
  "left-[28.1%] top-[39.9%]",
  "left-[32.6%] top-[55.7%]",
  "left-[38%] top-[69.6%]",
  "left-[46%] top-[77.4%]",
  "left-[52.9%] top-[84%]",
];

const pinBase = "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill";

export function TransitMap({ progress, collection }: { progress: number; collection: boolean }) {
  const step = Math.min(RIDER_POSITIONS.length - 1, Math.max(0, Math.floor(progress * 5)));

  return (
    <div className="flex w-full flex-col items-start gap-16 max-lg:gap-[12px]">
      <h2 className="w-full font-heading text-20 leading-[normal] font-black text-pw-ink max-lg:text-[20px]">
        Live Transit Map
      </h2>
      <div
        role="img"
        aria-label={
          collection
            ? "Map showing the Pizza Way store for collection"
            : "Map showing the rider on the way from the Pizza Way store to your address"
        }
        className="relative h-400 w-full overflow-clip rounded-24 border-2 border-solid border-pw-line bg-[#e8f1ec] max-lg:aspect-[832/400] max-lg:h-auto max-lg:rounded-[20px] max-sm:aspect-[4/3] max-sm:rounded-[16px]"
      >
        {ROADS.map((pos) => (
          <div
            key={pos}
            aria-hidden="true"
            className={`absolute h-16 -translate-x-1/2 -translate-y-1/2 bg-white max-lg:h-[12px] max-sm:h-[8px] ${pos}`}
          />
        ))}

        {!collection &&
          ROUTE.map((pos) => (
            <div
              key={pos}
              aria-hidden="true"
              className={`absolute h-6 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-pw-green-700 max-lg:h-[5px] max-sm:h-[4px] ${pos}`}
            />
          ))}

        {/* Store pin */}
        <div aria-hidden="true" className={`${pinBase} left-[23.6%] top-[24%] size-32 bg-pw-green-900 max-lg:size-[28px]`}>
          <Image src="/brand/tracking/store.svg" alt="" width={16} height={16} className="block size-16 max-lg:size-[14px]" />
          {collection && (
            <span className="absolute top-full left-1/2 mt-8 -translate-x-1/2 rounded-pill bg-white px-12 py-6 font-heading text-13 leading-[normal] font-extrabold whitespace-nowrap text-pw-green-900 shadow-sm max-lg:mt-[6px] max-lg:px-[10px] max-lg:py-[5px] max-lg:text-[12px]">
              Collect here
            </span>
          )}
        </div>

        {!collection && (
          <>
            {/* Destination pin */}
            <div aria-hidden="true" className={`${pinBase} left-[56%] top-[79%] size-32 max-lg:size-[28px]`}>
              <Image src="/brand/tracking/map-pin.svg" alt="" width={32} height={32} className="block size-32 max-lg:size-[28px]" />
            </div>

            {/* Rider pin */}
            <div
              aria-hidden="true"
              className={`${pinBase} size-40 border-3 border-solid border-white bg-pw-red-600 transition-[left,top] duration-700 motion-reduce:transition-none max-lg:size-[34px] max-lg:border-[3px] ${RIDER_POSITIONS[step]}`}
            >
              <Image src="/brand/tracking/bike.svg" alt="" width={20} height={20} className="block size-20 max-lg:size-[17px]" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
