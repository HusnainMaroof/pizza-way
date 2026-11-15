import { ByoConfigurator } from "./byo-configurator";
import { SummarySidebar } from "./byo-summary";

export function ByoWorkspace() {
  return (
    <section
      aria-label="Build your pizza"
      className="flex w-full items-start justify-between gap-48 bg-white py-12 px-80 max-lg:flex-col max-lg:items-stretch max-lg:gap-[40px] max-lg:px-[40px] max-lg:py-[56px] max-sm:gap-[32px] max-sm:px-[20px] max-sm:py-[40px]"
    >
      {/* Desktop: 50/50 split between options and the pizza card. */}
      <div className="min-w-0 flex-1 basis-0 max-lg:w-full max-lg:flex-none">
        <ByoConfigurator />
      </div>
      <div className="min-w-0 flex-1 basis-0 self-start lg:sticky lg:top-120 max-lg:w-full max-lg:flex-none">
        <SummarySidebar />
      </div>
    </section>
  );
}
