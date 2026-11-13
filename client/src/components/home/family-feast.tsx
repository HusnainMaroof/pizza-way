import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  "3 Pizzas (Any selection, any standard size up to 12”)",
  "3 Cold Soft Drinks (Custom selections)",
  "6 Pieces of Premium Hand-battered Garlic Bread",
  "Precision guaranteed real-time GPS courier delivery",
];

export function FamilyFeast() {
  return (
    <section
      className="w-full bg-white px-80 py-96 max-lg:px-[40px] max-lg:py-[64px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="family-feast-title"
    >
      <div className="mx-auto flex items-center justify-center gap-80 max-lg:max-w-[720px] max-lg:flex-col max-lg:items-stretch max-lg:gap-[40px] max-sm:gap-[28px]">
        <div className="relative h-480 w-600 shrink-0 overflow-hidden rounded-32 max-lg:aspect-[5/4] max-lg:h-auto max-lg:w-full max-lg:shrink max-lg:rounded-[24px] max-sm:aspect-[4/3] max-sm:rounded-[20px]">
          <Image
            src="/brand/images/family-feast-1.png"
            alt="Family sharing several pizzas and garlic bread at a wooden table"
            fill
            sizes="(max-width: 1023px) 100vw, 42vw"
            className="object-cover"
          />
        </div>

        <div className="flex w-580 shrink-0 flex-col items-start gap-40 max-lg:w-full max-lg:shrink max-lg:gap-[32px] max-sm:gap-[28px]">
          <div className="flex w-full flex-col items-start gap-20 max-lg:gap-[16px]">
            <span className="inline-flex whitespace-nowrap rounded-pill bg-pw-green-100 px-16 py-8 font-heading text-12 leading-[normal] font-extrabold text-pw-green-700 uppercase max-lg:px-[16px] max-lg:py-[8px] max-sm:whitespace-normal">
              Best value combo
            </span>
            <h2
              id="family-feast-title"
              className="font-heading text-48 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(28px,6vw,44px)] max-lg:leading-[1.1] max-lg:wrap-break-word max-sm:text-[length:clamp(26px,8vw,34px)]"
            >
              FEED THE WHOLE CREW.
            </h2>
            <p className="font-body text-16 leading-26 font-normal text-pw-muted max-lg:text-[16px] max-lg:leading-[1.6] max-sm:text-[15px]">
              The ultimate dining configuration. Hand-stretched sourdough, freshly fired for the
              perfect family evening or major workspace milestone.
            </p>
          </div>

          <ul className="flex w-full flex-col gap-16 max-lg:gap-[14px]">
            {FEATURES.map((text) => (
              <li key={text} className="flex items-center gap-12 max-lg:items-start max-lg:gap-[12px]">
                <span className="flex size-24 shrink-0 items-center justify-center rounded-12 bg-pw-green-700 max-lg:size-[24px] max-lg:rounded-[12px]">
                  <img src="/brand/icons/family-feast-icon.svg" alt="" width={12} height={12} />
                </span>
                <span className="min-w-1 flex-[1_0_0] font-body text-15 leading-[normal] font-medium text-pw-ink max-lg:min-w-0 max-lg:text-[15px] max-lg:leading-[1.5]">
                  {text}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-40 max-lg:w-full max-lg:flex-wrap max-lg:gap-x-[32px] max-lg:gap-y-[20px]">
            <div className="flex flex-col items-start gap-4 leading-[normal] whitespace-nowrap max-sm:whitespace-normal">
              <span className="font-body text-13 font-normal text-pw-muted uppercase max-lg:text-[13px]">
                The Family Feast System
              </span>
              <span className="font-heading text-48 font-black text-pw-green-700 max-lg:text-[length:clamp(32px,6vw,44px)]">
                £38.00
              </span>
            </div>
            <Link
              href="/deals"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-pw-red-600 px-36 py-18 font-heading text-16 leading-[normal] font-extrabold text-white uppercase no-underline max-lg:min-h-[48px] max-lg:px-[32px] max-lg:py-[14px] max-lg:text-[16px] max-sm:w-full max-sm:text-center max-sm:whitespace-normal"
            >
              Order Family Feast
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
