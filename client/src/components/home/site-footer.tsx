import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Menu", href: "/menu" },
      { label: "Deals", href: "/deals" },
      { label: "Order Online", href: "/build-your-pizza" },
      { label: "Locations", href: "/locations" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact Support", href: "/contact" },
      { label: "Careers", href: "/careers" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
];

const PAYMENTS = ["visa", "mastercard", "apple-pay", "google-pay"];

/** 0-height row; the 1px line sits just above it (Figma inset -1px 0 0 0). */
function Divider() {
  return (
    <div className="relative w-full h-0" aria-hidden="true">
      <Image
        src="/brand/icons/footer-line.svg"
        alt=""
        width={1280}
        height={1}
        className="absolute -top-1 left-0 block w-full h-1"
      />
    </div>
  );
}

/** Section 12: Branded Footer (Figma 97:386). */
export function SiteFooter() {
  return (
    <footer className="w-full bg-pw-footer pt-120 px-80 pb-48 max-lg:pt-[80px] max-lg:px-[40px] max-lg:pb-[40px] max-sm:pt-[64px] max-sm:px-[20px] max-sm:pb-[32px]">
      <div className="mx-auto flex flex-col items-start gap-80 max-lg:gap-[48px] max-sm:gap-[40px]">
        <Divider />

        {/* Tablet: brand full width on top; Explore + Help side by side below. */}
        <div className="w-full flex items-start justify-between max-lg:flex-wrap max-lg:justify-start max-lg:gap-[40px_24px] max-sm:gap-[32px_20px]">
          <div className="w-280 shrink-0 flex flex-col items-start gap-24 max-lg:w-full max-lg:flex-[0_0_100%] max-lg:gap-[20px]">
            {/* Figma: 180x38 box, logo drawn at native 194x40.5, offset 3px right / 1px up. Scales with the box on tablet. */}
            <Link
              href="/"
              className="relative block w-180 h-38 max-lg:w-[clamp(150px,30vw,180px)] max-lg:h-auto max-lg:aspect-[180/38] max-sm:w-[clamp(140px,42vw,170px)]"
              aria-label="Pizza Way home"
            >
              <Logo className="absolute left-3 -top-1 block w-194 h-auto max-lg:left-[calc(3/180*100%)] max-lg:top-[-1px] max-lg:w-[calc(194/180*100%)]" />
            </Link>
            <p className="m-0 w-full font-body font-normal text-14 leading-22 text-pw-green-100 max-lg:max-w-[440px] max-lg:text-[14px] max-lg:leading-[1.6] max-sm:max-w-none">
              Authentic Neapolitan sourdough pizzas engineered with pixel-perfect transaction clarity. Hand-stretched
              daily across the United Kingdom.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav
              key={col.title}
              className="w-180 shrink-0 flex flex-col items-start gap-16 max-lg:w-auto max-lg:flex-[1_1_0] max-lg:min-w-0 max-lg:max-w-[240px] max-lg:gap-[4px]"
              aria-label={col.title}
            >
              <p className="m-0 w-full font-heading font-extrabold text-15 leading-[normal] uppercase text-white max-lg:mb-[8px] max-lg:text-[15px]">
                {col.title}
              </p>
              {col.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block w-full font-body font-normal text-14 leading-[normal] text-pw-green-100 no-underline hover:text-white max-lg:flex max-lg:items-center max-lg:min-h-[44px] max-lg:text-[15px] max-sm:text-[14px]"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <Divider />

        {/* Phone: copyright on top, chips wrap below, left-aligned. */}
        <div className="w-full flex items-center justify-between max-lg:flex-wrap max-lg:gap-[16px_24px] max-sm:flex-col max-sm:items-start max-sm:gap-[16px]">
          <p className="m-0 font-body font-normal text-13 leading-[normal] whitespace-nowrap text-pw-green-100 max-lg:whitespace-normal max-lg:text-[13px] max-lg:leading-[1.5] max-sm:text-[14px]">
            © 2026 Pizzaway UK Ltd. All rights reserved. Precision stone-fired sourdough standard.
          </p>
          <ul
            className="m-0 p-0 list-none flex items-start gap-12 max-lg:flex-wrap max-lg:gap-[8px]"
            aria-label="Accepted payment methods"
          >
            {PAYMENTS.map((p) => (
              <li
                key={p}
                className="py-4 px-8 bg-pw-green-700 rounded-6 font-heading font-extrabold text-11 leading-[normal] uppercase whitespace-nowrap text-white max-lg:py-[6px] max-lg:px-[10px] max-lg:text-[12px]"
              >
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
