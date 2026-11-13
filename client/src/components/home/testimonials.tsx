import Image from "next/image";

const TESTIMONIALS = [
  {
    quote:
      "Pizzaway has completely changed weekend meals for us. The sourdough is incredibly light and charred perfectly. You can literally taste the fresh quality ingredients.",
    name: "Danielle Vance",
    location: "Manchester",
  },
  {
    quote:
      "Absolute fintech-level clarity! I built my own custom sourdough pie with precise live price updates, ordered on mobile, and it was hot on my table in 22 minutes.",
    name: "Marcus Sterling",
    location: "London Soho",
  },
  {
    quote:
      "The Family Feast combo is the best value in the UK food delivery space. Incredible sourdough standard and the warm garlic dough-bread is simply unmatched.",
    name: "Evelyn Porter",
    location: "Leeds",
  },
];

/** Section 10: Testimonials (Figma 97:304). */
export function Testimonials() {
  return (
    <section
      className="w-full bg-white py-120 px-80 max-lg:py-[80px] max-lg:px-[40px] max-sm:py-[64px] max-sm:px-[20px]"
      aria-labelledby="testimonials-title"
    >
      <div className="mx-auto flex flex-col items-center gap-64 max-lg:gap-[40px] max-sm:gap-[32px]">
        <div className="w-full flex flex-col items-center gap-16 text-center leading-[normal]">
          <p className="font-heading font-extrabold text-16 uppercase text-pw-green-700 max-lg:text-[14px]">
            The pizza community
          </p>
          <h2
            id="testimonials-title"
            className="font-heading font-black text-48 leading-[normal] text-pw-ink max-lg:text-[length:clamp(32px,5vw,44px)] max-lg:wrap-break-word max-sm:text-[length:clamp(28px,8vw,36px)]"
          >
            Loved by Pizza Lovers.
          </h2>
        </div>

        {/* Tablet: 3 equal columns; <= 760px: single column. */}
        <div className="w-full flex items-start gap-24 max-lg:grid max-lg:grid-cols-3 max-lg:items-stretch max-lg:gap-[16px] max-[760px]:grid-cols-1 max-[760px]:max-w-[560px] max-[760px]:mx-auto max-sm:max-w-none">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex-[1_0_0] min-w-1 m-0 flex flex-col items-start gap-24 p-40 bg-pw-surface border border-pw-line rounded-24 max-lg:min-w-0 max-lg:gap-[16px] max-lg:p-[24px] max-[760px]:p-[28px] max-sm:py-[24px] max-sm:px-[20px] max-sm:rounded-[20px]"
            >
              <div className="flex gap-4" role="img" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <Image
                    key={i}
                    src="/brand/icons/testimonial-star.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="block shrink-0"
                  />
                ))}
              </div>
              <blockquote className="m-0 w-full font-body font-normal italic text-15 leading-24 text-pw-ink max-lg:text-[14px] max-lg:leading-[1.6] max-[760px]:text-[15px]">
                &quot;{t.quote}&quot;
              </blockquote>
              <figcaption className="w-full flex flex-col gap-2 leading-[normal]">
                <span className="font-heading font-extrabold text-16 text-pw-ink max-lg:text-[15px] max-sm:text-[16px]">
                  {t.name}
                </span>
                <span className="font-body font-normal text-13 text-pw-muted max-lg:text-[13px] max-sm:text-[14px]">
                  {t.location}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
