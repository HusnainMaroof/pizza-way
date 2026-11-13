"use client";

import { useState } from "react";

type Faq = {
  id: string;
  question: string;
  answer: string;
};

const FAQS: Faq[] = [
  {
    id: "delivery-areas",
    question: "What areas do you deliver to?",
    answer:
      "We deliver across major metropolitan areas in the UK. Enter your postcode in our locator at the bottom of the homepage to check direct hotbox eligibility.",
  },
  {
    id: "delivery-time",
    question: "How long does delivery take?",
    answer:
      "Most orders arrive within 30 to 45 minutes of checkout. Live tracking in your order confirmation shows the exact time your pizza leaves the stone oven.",
  },
  {
    id: "customise",
    question: "Can I customise my pizza?",
    answer:
      "Absolutely. Use Build Your Pizza to choose your base, sauce, cheese and toppings, or add and remove toppings on any menu pizza before adding it to your basket.",
  },
  {
    id: "payment",
    question: "What payment methods do you accept?",
    answer:
      "We accept Visa, Mastercard, Apple Pay and Google Pay online, plus card and cash payments at any of our pizzerias.",
  },
  {
    id: "dietary",
    question: "Do you cater for dietary requirements?",
    answer:
      "Yes. We offer vegetarian and vegan options, plus full allergen information for every item. Please mention any allergies in your order notes or contact your local pizzeria.",
  },
];

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);

  return (
    <section
      id="faq"
      className="flex w-full scroll-mt-[80px] flex-col items-center gap-48 bg-pw-surface p-96 max-lg:gap-[36px] max-lg:px-[40px] max-lg:py-[64px] max-sm:gap-[28px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="faq-title"
    >
      <header className="flex w-full flex-col items-center gap-12 text-center leading-[normal] max-lg:gap-[10px]">
        <p className="font-heading text-16 leading-[normal] font-extrabold text-pw-green-700 uppercase max-lg:text-[14px]">
          KNOWLEDGE CONTROL
        </p>
        <h2
          id="faq-title"
          className="font-heading text-44 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(26px,6vw,40px)] max-lg:leading-[1.15] max-sm:text-[length:clamp(24px,7.5vw,32px)]"
        >
          Frequently Answered Questions
        </h2>
      </header>

      <div className="flex w-800 max-w-full flex-col items-start gap-16 max-lg:w-full max-lg:max-w-[720px] max-lg:gap-[12px]">
        {FAQS.map((faq) => {
          const open = openId === faq.id;
          const buttonId = `faq-${faq.id}-button`;
          const panelId = `faq-${faq.id}-panel`;
          return (
            <div
              key={faq.id}
              className="w-full rounded-16 border border-solid border-pw-line bg-white max-lg:rounded-[14px]"
            >
              <h3 className="font-heading">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenId(open ? null : faq.id)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-16 rounded-16 px-24 pt-24 text-left transition-[padding] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[56px] max-lg:gap-[12px] max-lg:rounded-[14px] max-lg:px-[20px] max-lg:pt-[18px] ${
                    open ? "pb-12 max-lg:pb-[10px]" : "pb-24 max-lg:pb-[18px]"
                  }`}
                >
                  <span className="font-heading text-16 leading-[normal] font-extrabold text-pw-ink max-lg:text-[16px]">
                    {faq.question}
                  </span>
                  <img
                    src={open ? "/brand/contact/faq-chevron-up.svg" : "/brand/contact/faq-chevron-down.svg"}
                    alt=""
                    width={16}
                    height={16}
                    className="size-16 shrink-0 max-lg:size-[16px]"
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0 overflow-hidden" inert={!open}>
                  <p className="px-24 pb-24 font-body text-14 leading-22 font-normal text-pw-muted max-lg:px-[20px] max-lg:pb-[18px] max-lg:text-[14px] max-lg:leading-[1.6] max-sm:text-[15px]">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
