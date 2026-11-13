import {
  PRIVACY_INTRO,
  PRIVACY_LAST_UPDATED,
  PRIVACY_SECTIONS,
  type PrivacyBlock,
} from "./privacy-data";

const PARAGRAPH =
  "w-full font-body text-15 leading-26 font-normal text-pw-muted max-lg:text-[15px] max-lg:leading-[1.7]";

function Block({ block }: { block: PrivacyBlock }) {
  switch (block.type) {
    case "p":
      return <p className={PARAGRAPH}>{block.text}</p>;
    case "h3":
      return (
        <h3 className="w-full font-heading text-18 leading-[normal] font-bold text-pw-ink max-lg:text-[17px]">
          {block.text}
        </h3>
      );
    case "ul":
      return (
        <ul className="m-0 flex w-full list-none flex-col gap-16 p-0 max-lg:gap-[14px]">
          {block.items.map((item) => {
            const key = typeof item === "string" ? item : item.title;
            return (
              <li
                key={key}
                className="relative flex w-full flex-col gap-4 pl-16 before:absolute before:top-10 before:left-0 before:size-6 before:rounded-full before:bg-pw-green-700 before:content-[''] max-lg:gap-[4px] max-lg:pl-[16px] max-lg:before:top-[9px] max-lg:before:size-[6px]"
              >
                {typeof item === "string" ? (
                  <span className="font-body text-15 leading-24 font-normal text-pw-muted max-lg:text-[15px] max-lg:leading-[1.6]">
                    {item}
                  </span>
                ) : (
                  <>
                    <strong className="font-heading text-16 leading-[normal] font-bold text-pw-ink max-lg:text-[16px]">
                      {item.title}
                    </strong>
                    <span className="font-body text-15 leading-24 font-normal text-pw-muted max-lg:text-[15px] max-lg:leading-[1.6]">
                      {item.text}
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      );
    case "contact":
      return (
        <dl className="m-0 flex w-full flex-col gap-16 rounded-16 bg-pw-surface p-24 max-lg:gap-[14px] max-lg:rounded-[16px] max-lg:p-[20px] max-sm:p-[16px]">
          {block.rows.map((row) => (
            <div
              key={row.label}
              className="flex w-full items-start gap-16 max-lg:gap-[16px] max-sm:flex-col max-sm:gap-[4px]"
            >
              <dt className="w-120 shrink-0 font-heading text-14 leading-[normal] font-extrabold text-pw-ink uppercase max-lg:w-[120px] max-lg:text-[14px] max-sm:w-auto">
                {row.label}
              </dt>
              <dd className="m-0 min-w-0 flex-1 font-body text-15 leading-[normal] break-words max-lg:text-[15px]">
                {row.href ? (
                  <a
                    href={row.href}
                    className="inline-flex font-bold text-pw-green-700 no-underline hover:underline max-lg:min-h-[44px] max-lg:items-center max-sm:min-h-[44px] [overflow-wrap:anywhere]"
                  >
                    {row.value}
                  </a>
                ) : (
                  <span
                    className={
                      row.label.startsWith("HQ")
                        ? "leading-22 text-pw-muted max-lg:leading-[1.5]"
                        : "text-pw-ink"
                    }
                  >
                    {row.value}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      );
  }
}

/** Privacy Policy: Legal Content Column (Figma 184:277). */
export function LegalContent() {
  return (
    <article className="flex w-916 min-w-0 shrink-0 flex-col items-start gap-48 rounded-32 border-[1.5px] border-solid border-pw-line bg-white p-48 max-lg:w-full max-lg:shrink max-lg:gap-[40px] max-lg:rounded-[24px] max-lg:p-[32px] max-sm:gap-[32px] max-sm:rounded-[20px] max-sm:p-[20px]">
      <header className="flex w-full flex-col items-start gap-12 max-lg:gap-[12px]">
        <p className="font-heading text-15 leading-[normal] font-bold text-pw-green-700 uppercase max-lg:text-[14px]">
          {PRIVACY_LAST_UPDATED}
        </p>
        <p className={PARAGRAPH}>{PRIVACY_INTRO}</p>
      </header>

      {PRIVACY_SECTIONS.map((section, i) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-title`}
          className="flex w-full scroll-mt-120 flex-col items-start gap-20 border-b border-solid border-pw-line pb-48 max-lg:scroll-mt-[96px] max-lg:gap-[18px] max-lg:pb-[40px] max-sm:pb-[32px]"
        >
          <h2
            id={`${section.id}-title`}
            className="w-full font-heading text-28 leading-[normal] font-extrabold text-pw-ink break-words max-lg:text-[length:clamp(22px,4vw,28px)] max-lg:leading-[1.25] max-sm:text-[length:clamp(20px,6.2vw,24px)]"
          >
            {i + 1}. {section.title}
          </h2>
          <div className="flex w-full flex-col items-start gap-16 max-lg:gap-[14px]">
            {section.blocks.map((block, j) => (
              <Block key={j} block={block} />
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
