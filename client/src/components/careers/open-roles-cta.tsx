import Link from "next/link";

/** Open Roles: Don't See The Right Role CTA (Figma 186:274). */
export function OpenRolesCta() {
  return (
    <section
      className="flex w-full flex-col items-center gap-32 bg-pw-green-900 p-96 text-center [word-break:break-word] max-lg:gap-[24px] max-lg:px-[40px] max-lg:py-[72px] max-sm:gap-[20px] max-sm:px-[20px] max-sm:py-[56px]"
      aria-labelledby="open-roles-cta-title"
    >
      <h2
        id="open-roles-cta-title"
        className="font-heading text-44 font-black leading-[normal] text-white max-lg:text-[length:clamp(26px,5vw,40px)] max-lg:leading-[1.15] max-sm:text-[length:clamp(22px,7.5vw,32px)]"
      >
        DON&apos;T SEE THE RIGHT ROLE?
      </h2>
      <p className="w-600 max-w-full font-body text-18 font-normal leading-28 text-pw-green-100 max-lg:w-[560px] max-lg:text-[16px] max-lg:leading-[1.6] max-sm:w-full max-sm:text-[15px]">
        We are always on the lookout for talented dough stretchers, friendly delivery experts, and operational masters.
        Submit your speculative application today.
      </p>
      <div className="flex items-start max-sm:w-full max-sm:max-w-[360px] max-sm:flex-col max-sm:items-stretch">
        <Link
          href="/contact"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-pw-red-600 px-32 py-16 font-heading text-14 font-extrabold uppercase leading-[normal] text-white no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-lg:min-h-[48px] max-lg:px-[32px] max-lg:py-[14px] max-lg:text-[14px] max-sm:w-full max-sm:px-[24px]"
        >
          Submit Your CV
        </Link>
      </div>
    </section>
  );
}
