import { LegalContent } from "./legal-content";
import { PolicySidebar } from "./policy-sidebar";

/** Privacy Policy: Main Workspace (Figma 184:254): sticky index (300) + legal column (916). */
export function PrivacyWorkspace() {
  return (
    <section
      className="w-full bg-pw-surface p-80 max-lg:px-[40px] max-lg:py-[64px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-label="Privacy policy"
    >
      <div className="flex w-full items-start gap-64 max-lg:mx-auto max-lg:max-w-[820px] max-lg:flex-col max-lg:items-stretch max-lg:gap-[24px] max-sm:gap-[20px]">
        <PolicySidebar />
        <LegalContent />
      </div>
    </section>
  );
}
