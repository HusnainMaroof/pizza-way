type HelpCard = {
  title: string;
  text: string;
  icon: string;
  href: string;
  cta: string;
};

/* Anchors: "#contact-info" / "#contact-form" live in MainWorkspace, "#faq" in FaqSection. */
const HELP_CARDS: HelpCard[] = [
  {
    title: "Order Issues",
    text: "Track, edit or report an active transaction issue with your local pizzeria.",
    icon: "/brand/contact/help-shopping-bag.svg",
    href: "#contact-info",
    cta: "Go to section",
  },
  {
    title: "Delivery Help",
    text: "Questions about estimated delivery times, pricing tiers, and delivery radiuses.",
    icon: "/brand/contact/help-truck.svg",
    href: "#faq",
    cta: "Go to section",
  },
  {
    title: "General Enquiry",
    text: "For dietary questions, franchise requests, partnerships, or feed-back.",
    icon: "/brand/contact/help-mail.svg",
    href: "#contact-form",
    cta: "Go to section",
  },
];

export function HelpCards() {
  return (
    <section
      aria-label="Help topics"
      className="relative w-full bg-pw-surface px-80 max-lg:px-[40px] max-sm:px-[20px]"
    >
      {/* Cards sit 40 design px up over the hero (Figma: HelpCards frame 205 tall, cards 245 at y -40). */}
      <ul className="relative z-10 -mt-40 flex items-start gap-24 max-lg:-mt-[32px] max-lg:grid max-lg:items-stretch max-lg:gap-[16px] max-[900px]:grid-cols-1 min-[900px]:max-lg:grid-cols-3 sm:max-[900px]:mx-auto sm:max-[900px]:w-full sm:max-[900px]:max-w-[640px] max-sm:-mt-[24px]">
        {HELP_CARDS.map((card) => (
          <li key={card.title} className="flex min-w-1 flex-[1_0_0] max-lg:min-w-0">
            <a
              href={card.href}
              className="group flex w-full flex-col items-start gap-16 rounded-24 border-[1.5px] border-solid border-pw-line bg-white p-32 drop-shadow-[0px_4px_8px_rgba(0,0,0,0.05)] transition-colors hover:border-pw-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:gap-[12px] max-lg:rounded-[20px] max-lg:p-[24px]"
            >
              <span className="flex size-48 shrink-0 items-center justify-center rounded-24 bg-pw-green-100 max-lg:size-[44px] max-lg:rounded-[22px]">
                <img src={card.icon} alt="" width={20} height={20} className="size-20 max-lg:size-[20px]" />
              </span>
              <h2 className="font-heading text-20 leading-[normal] font-extrabold whitespace-nowrap text-pw-ink max-lg:text-[19px] max-sm:whitespace-normal">
                {card.title}
              </h2>
              <p className="w-full font-body text-14 leading-22 font-normal text-pw-muted max-lg:text-[14px] max-lg:leading-[1.6] max-sm:text-[15px]">
                {card.text}
              </p>
              <span className="inline-flex items-center gap-4 font-heading text-13 leading-[normal] font-extrabold whitespace-nowrap text-pw-green-700 uppercase max-lg:min-h-[24px] max-lg:text-[13px]">
                {card.cta}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-2">
                  →
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
