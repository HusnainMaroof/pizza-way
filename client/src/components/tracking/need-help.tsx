import Link from "next/link";

const cardClass =
  "flex w-400 min-w-0 shrink-0 flex-col items-start gap-16 rounded-24 bg-pw-green-900 p-40 wrap-break-word max-lg:w-auto max-lg:flex-[1_1_0] max-lg:max-w-[420px] max-lg:gap-[14px] max-lg:rounded-[20px] max-lg:p-[28px] max-[760px]:w-full max-[760px]:max-w-none max-[760px]:flex-none max-sm:p-[24px]";

const cardTitle = "w-full font-heading text-24 leading-[normal] font-black text-white max-lg:text-[length:clamp(20px,3vw,24px)]";

const cardText = "w-full font-body text-14 leading-22 font-normal text-pw-green-100 max-lg:text-[14px] max-lg:leading-[22px]";

const btnBase =
  "inline-flex items-center justify-center rounded-pill px-24 py-12 font-heading text-13 leading-[normal] font-extrabold whitespace-nowrap uppercase transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-lg:min-h-[44px] max-lg:px-[24px] max-lg:py-[12px] max-lg:text-[13px]";

/** Order tracking "We are here to help" section (Figma 97:2169). */
export function NeedHelp() {
  return (
    <section
      aria-labelledby="need-help-title"
      className="flex w-full flex-col items-start gap-48 bg-pw-green-700 px-80 py-100 max-lg:gap-[36px] max-lg:px-[40px] max-lg:py-[72px] max-sm:gap-[28px] max-sm:px-[20px] max-sm:py-[56px]"
    >
      <div className="flex w-full flex-col items-center gap-16 text-center leading-[normal] max-lg:gap-[12px]">
        <p className="w-full font-heading text-14 leading-[normal] font-extrabold text-pw-green-500 uppercase max-lg:text-[14px] max-sm:text-[13px]">
          Issues with formulation?
        </p>
        <h2
          id="need-help-title"
          className="w-full font-heading text-48 leading-[normal] font-black text-white max-lg:text-[length:clamp(30px,5vw,44px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(24px,7.5vw,34px)]"
        >
          WE ARE HERE TO HELP.
        </h2>
      </div>

      <div className="flex w-full items-stretch justify-center gap-32 max-lg:gap-[20px] max-[760px]:flex-col max-[760px]:items-center max-sm:gap-[16px]">
        <div className={cardClass}>
          <h3 className={cardTitle}>Contact Support</h3>
          <p className={cardText}>
            Talk directly with our culinary transaction desk to solve order anomalies in real time.
          </p>
          <Link href="/contact" className={`${btnBase} bg-white text-pw-ink`}>
            CALL NOW
          </Link>
        </div>
        <div className={cardClass}>
          <h3 className={cardTitle}>Delivery FAQs</h3>
          <p className={cardText}>Gain instant insights about our patented hotbox thermal containment metrics.</p>
          <Link href="/contact#faq" className={`${btnBase} border-[1.5px] border-solid border-white text-white`}>
            READ FAQS
          </Link>
        </div>
      </div>
    </section>
  );
}
