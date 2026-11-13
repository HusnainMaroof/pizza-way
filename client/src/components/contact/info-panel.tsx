import Image from "next/image";

const ITEMS = [
  {
    icon: "/brand/contact/mail.svg",
    label: "Email Support",
    value: "hello@pizzawayuk.com",
    href: "mailto:hello@pizzawayuk.com",
    note: "We respond within 2 hours.",
  },
  {
    icon: "/brand/contact/phone.svg",
    label: "Phone Hotline",
    value: "0800 PIZZA WAY",
    href: null, // vanity number only in the design; no dialable digits known
    note: "Mon-Sun 11am - 11pm.",
  },
  {
    icon: "/brand/contact/map-pin.svg",
    label: "Corporate Office",
    value: "Pizzaway HQ, London EC1A",
    href: null,
    note: "Sourdough logistics center.",
  },
] as const;

/** Direct contacts card (Figma 97:2623). */
export function InfoPanel() {
  return (
    <aside id="contact-info"
      className="scroll-mt-120 flex w-472 shrink-0 flex-col items-start gap-32 p-40 bg-pw-surface border-[1.5px] border-solid border-pw-line rounded-32 max-lg:w-full max-lg:gap-[24px] max-lg:p-[32px] max-lg:rounded-[24px] max-sm:p-[20px] max-sm:rounded-[20px]"
      aria-labelledby="contact-info-title"
    >
      <h2
        id="contact-info-title"
        className="font-heading font-black text-24 leading-[normal] text-pw-ink max-lg:text-[22px]"
      >
        Direct Contacts
      </h2>
      <ul className="m-0 flex list-none flex-col items-start gap-24 p-0 max-lg:gap-[20px]">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex min-w-0 items-center gap-16 max-lg:gap-[14px]">
            <span className="flex size-40 shrink-0 items-center justify-center rounded-20 bg-white max-lg:size-[44px] max-lg:rounded-[22px]">
              <Image src={item.icon} alt="" width={16} height={16} className="block size-16 max-lg:size-[16px]" />
            </span>
            <span className="flex min-w-0 flex-col items-start gap-2 leading-[normal]">
              <span className="font-body font-normal text-12 text-pw-muted max-lg:text-[12px]">{item.label}</span>
              {item.href ? (
                <a
                  href={item.href}
                  className="font-heading font-extrabold text-16 text-pw-ink no-underline wrap-break-word rounded-6 outline-none hover:text-pw-green-700 focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-2 max-lg:text-[16px]"
                >
                  {item.value}
                </a>
              ) : (
                <span className="font-heading font-extrabold text-16 text-pw-ink wrap-break-word max-lg:text-[16px]">
                  {item.value}
                </span>
              )}
              <span className="font-body font-normal text-12 text-pw-muted max-lg:text-[12px]">{item.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
