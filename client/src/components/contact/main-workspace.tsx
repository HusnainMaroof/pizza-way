import { ContactForm } from "./contact-form";
import { InfoPanel } from "./info-panel";

/** Contact page main workspace (Figma 97:2594): form on the left, direct contacts on the right. */
export function MainWorkspace() {
  return (
    <section
      className="w-full bg-white p-80 max-lg:py-[64px] max-lg:px-[40px] max-sm:py-[48px] max-sm:px-[20px]"
      aria-label="Contact us"
    >
      <div className="flex w-full items-start gap-48 max-lg:flex-col max-lg:gap-[32px] max-sm:gap-[28px]">
        <ContactForm />
        <InfoPanel />
      </div>
    </section>
  );
}
