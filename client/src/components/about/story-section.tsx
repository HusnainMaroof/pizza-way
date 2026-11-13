import Image from "next/image";

export function StorySection() {
  return (
    <section
      className="w-full bg-white p-96 max-lg:px-[40px] max-lg:py-[64px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="story-title"
    >
      <div className="mx-auto flex items-center gap-80 max-lg:max-w-[720px] max-lg:flex-col max-lg:items-stretch max-lg:gap-[40px] max-sm:gap-[28px]">
        <div className="relative h-450 w-550 shrink-0 overflow-hidden rounded-32 max-lg:aspect-[11/9] max-lg:h-auto max-lg:w-full max-lg:shrink max-lg:rounded-[24px] max-sm:rounded-[20px]">
          <Image
            src="/brand/about/about-story.png"
            alt="Pizza chef tossing sourdough in a flour-dusted kitchen beside a wood-fired oven"
            fill
            sizes="(max-width: 1023px) 100vw, 39vw"
            className="object-cover"
          />
        </div>

        <div className="flex w-630 shrink-0 flex-col items-start gap-32 max-lg:w-full max-lg:shrink max-lg:gap-[20px] max-sm:gap-[16px]">
          <p className="font-heading text-16 leading-[normal] font-extrabold whitespace-nowrap text-pw-green-700 uppercase max-lg:text-[14px] max-sm:whitespace-normal">
            The Pizzaway heritage
          </p>
          <h2
            id="story-title"
            className="w-full font-heading text-48 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(28px,6vw,44px)] max-lg:leading-[1.1] max-lg:wrap-break-word max-sm:text-[length:clamp(26px,8vw,34px)]"
          >
            Born out of passion for genuine sourdough.
          </h2>
          <p className="w-full font-body text-16 leading-26 font-normal text-pw-muted max-lg:text-[16px] max-lg:leading-[1.6] max-sm:text-[15px]">
            We founded Pizzaway with a single clear mission: to bring authentic, high-quality,
            neapolitan sourdough pizzas to communities across the UK without the premium price
            markup. Our signature crust goes through a slow 48-hour cold fermentation process,
            ensuring maximum flavor, a beautifully charred leopard-spotted crust, and perfect
            digestibility.
          </p>
          <p className="w-full font-body text-16 leading-26 font-normal text-pw-muted max-lg:text-[16px] max-lg:leading-[1.6] max-sm:text-[15px]">
            Combined with our customized ordering process, you dictate the parameters of your
            perfect pizza.
          </p>
        </div>
      </div>
    </section>
  );
}
