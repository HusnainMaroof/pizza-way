import Image from "next/image";
import Link from "next/link";

const BUTTON =
  "inline-flex items-center justify-center whitespace-nowrap rounded-pill px-36 py-18 font-heading text-14 font-extrabold uppercase leading-[normal] text-white no-underline max-lg:min-h-[48px] max-lg:px-[32px] max-lg:py-[14px] max-lg:text-[14px] max-sm:w-full max-sm:px-[24px]";

const TRUST = [
  { icon: "/brand/careers/hero-clock.svg", label: "Flexible Shifts" },
  { icon: "/brand/careers/hero-users.svg", label: "Over 1,200 Crew Members" },
];

/** Careers: Green Hero (Figma 184:24). */
export function CareersHero() {
  return (
    <section
      className="w-full bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#03872d_0%,#036a24_50%,#024d1a_100%)] p-80 max-lg:px-[40px] max-lg:py-[64px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="careers-hero-title"
    >
      <div className="flex w-full items-center gap-48 max-lg:mx-auto max-lg:max-w-[720px] max-lg:flex-col max-lg:items-stretch max-lg:gap-[40px] max-sm:gap-[28px]">
        <div className="flex w-680 shrink-0 flex-col items-start gap-40 max-lg:w-full max-lg:shrink max-lg:gap-[28px] max-sm:gap-[24px]">
          <span className="inline-flex whitespace-nowrap rounded-pill border border-pw-green-500 bg-pw-green-900 px-16 py-8 font-heading text-12 leading-[normal] font-extrabold text-pw-green-500 uppercase max-lg:px-[16px] max-lg:py-[8px] max-sm:whitespace-normal">
            Grow with Pizzaway • Careers &amp; Culture
          </span>
          <div className="flex w-full flex-col items-start gap-16 max-lg:gap-[16px]">
            <h1
              id="careers-hero-title"
              className="w-full font-heading text-[length:calc(90*var(--u))] leading-85 font-black text-white max-lg:text-[length:clamp(44px,9vw,84px)] max-lg:leading-[0.95] max-sm:text-[length:clamp(36px,11.5vw,56px)]"
            >
              JOIN OUR
              <br />
              CREW.
            </h1>
            <p className="w-full font-body text-20 leading-32 font-normal text-pw-green-100 max-lg:text-[18px] max-lg:leading-[1.6] max-sm:text-[16px]">
              Build your future alongside our signature Neapolitan sourdough. We hand-stretch daily,
              fire hot, and grow together as one team.
            </p>
          </div>
          <div className="flex items-start gap-16 max-lg:gap-[12px] max-sm:w-full max-sm:flex-col max-sm:items-stretch">
            <Link href="/careers/open-roles" className={`${BUTTON} bg-pw-red-600`}>
              View Open Roles
            </Link>
            <Link href="#culture" className={`${BUTTON} border-[1.5px] border-white`}>
              Our Culture
            </Link>
          </div>
          <ul className="m-0 flex list-none items-center gap-32 p-0 max-lg:flex-wrap max-lg:gap-x-[24px] max-lg:gap-y-[12px]">
            {TRUST.map((t) => (
              <li key={t.label} className="flex items-center gap-8 max-lg:gap-[8px]">
                <img
                  src={t.icon}
                  alt=""
                  width={16}
                  height={16}
                  className="size-16 shrink-0 max-lg:size-[16px]"
                />
                <span className="whitespace-nowrap font-body text-14 leading-[normal] font-medium text-white max-lg:text-[14px]">
                  {t.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex h-450 w-550 shrink-0 flex-col items-center justify-center max-lg:h-auto max-lg:w-full max-lg:shrink">
          <div className="relative h-390 w-520 shrink-0 overflow-hidden rounded-24 max-lg:aspect-[4/3] max-lg:h-auto max-lg:w-full max-lg:shrink max-lg:rounded-[24px] max-sm:rounded-[20px]">
            <Image
              src="/brand/careers/careers-hero-kitchen.png"
              alt="Smiling Pizzaway crew stretching sourdough bases in an open pizzeria kitchen"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 37vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
