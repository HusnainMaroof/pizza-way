import Image from "next/image";
import Link from "next/link";
import { HeroMotion } from "@/components/home/hero-motion";

const BUTTON =
  "box-border flex items-center justify-center h-56 py-18 px-36 rounded-pill font-heading font-extrabold text-16 leading-[normal] text-white uppercase no-underline whitespace-nowrap max-lg:h-auto max-lg:min-h-[52px] max-lg:py-[14px] max-lg:px-[32px] max-lg:text-[16px] max-sm:w-full max-sm:min-h-[48px]";

// Motion only (no sizing). Elements animated in by HeroMotion start hidden only when motion is allowed (no pre-hydration flash).
const ENTER = "motion-safe:opacity-0";
const BUTTON_MOTION =
  "transition-[translate,scale] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-[2px] motion-safe:active:scale-[0.97]";

export function Hero() {
  return (
    <HeroMotion className="w-full h-532 overflow-visible bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#03872d_0%,#036a24_50%,#024d1a_100%)] max-lg:h-auto max-lg:overflow-hidden">
      <div className="box-content h-550 m-0 px-80 flex items-center justify-between gap-48 max-lg:box-border max-lg:h-auto max-lg:pt-[56px] max-lg:px-[40px] max-lg:pb-[40px] max-lg:flex-col max-lg:items-center max-lg:justify-start max-lg:gap-[32px] max-sm:pt-[40px] max-sm:px-[20px] max-sm:pb-[32px] max-sm:gap-[24px]">
        <div className="w-680 shrink-0 flex flex-col items-start gap-40 max-lg:w-full max-lg:max-w-[640px] max-lg:shrink max-lg:items-center max-lg:gap-[28px] max-lg:text-center max-sm:gap-[24px]">
          <div className="w-full flex flex-col gap-16 max-lg:items-center">
            <h1 className="font-heading font-black text-110 leading-90 text-white max-lg:text-[length:clamp(44px,14vw,96px)] max-lg:leading-[0.88] max-lg:wrap-break-word max-sm:text-[length:clamp(44px,15vw,80px)]">
              <span data-hero="line" className={`block ${ENTER}`}>
                PIZZA
              </span>
              <span data-hero="line" className={`block ${ENTER}`}>
                YOUR WAY.
              </span>
            </h1>
            <p data-hero="lead" className={`font-body font-normal text-20 leading-32 text-pw-green-100 max-lg:max-w-[560px] max-lg:text-[18px] max-lg:leading-[1.6] max-sm:text-[16px] ${ENTER}`}>
              Hot. Fresh. Precision-delivered. Hand-stretched sourdough meets absolute ingredient
              clarity. Built live by you, baked to charred perfection.
            </p>
          </div>
          <div className="flex items-start gap-16 max-lg:flex-wrap max-lg:justify-center max-lg:gap-[12px] max-sm:w-full max-sm:flex-col max-sm:items-stretch">
            <Link href="/menu" data-hero="cta" className={`${BUTTON} bg-pw-red-600 ${BUTTON_MOTION} ${ENTER}`}>
              Order Now
            </Link>
            <Link
              href="/menu"
              data-hero="cta"
              className={`${BUTTON} bg-transparent border-[1.5px] border-white ${BUTTON_MOTION} ${ENTER}`}
            >
              Explore Menu
            </Link>
          </div>
        </div>

        <div data-hero="pizza-wrap" className="relative w-550 h-550 shrink-0 lg:will-change-transform max-lg:w-full max-lg:max-w-[440px] max-lg:h-auto max-lg:shrink max-sm:max-w-[340px]">
          <Image
            src="/brand/images/hero-pizza-slice.png"
            alt="Pepperoni pizza slice with melted cheese"
            width={520}
            height={520}
            priority
            data-hero="pizza"
            className={`absolute top-0 left-0 w-520 h-520 max-lg:static max-lg:block max-lg:w-full max-lg:h-auto max-lg:object-contain will-change-transform ${ENTER}`}
          />
        </div>
      </div>
    </HeroMotion>
  );
}
