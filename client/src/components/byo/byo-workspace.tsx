import { ByoConfigurator } from "./byo-configurator";
import { SummarySidebar } from "./byo-summary";

export function ByoWorkspace() {
  return (
    <section
      aria-label="Build your pizza"
      className="flex w-full items-start justify-between gap-48 bg-white py-80 pr-60 pl-80 max-lg:flex-col max-lg:items-stretch max-lg:gap-[40px] max-lg:px-[40px] max-lg:py-[56px] max-sm:gap-[32px] max-sm:px-[20px] max-sm:py-[40px]"
    >
      <div className="w-704 min-w-0 shrink-0 max-lg:w-full max-lg:shrink">
        <ByoConfigurator />
      </div>
      <div className="w-480 min-w-0 shrink-0 self-start lg:sticky lg:top-120 max-lg:w-full max-lg:shrink">
        <SummarySidebar />
      </div>
    </section>
  );
}
