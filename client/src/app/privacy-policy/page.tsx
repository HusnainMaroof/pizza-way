import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { PrivacyHero } from "@/components/privacy/privacy-hero";
import { PrivacyWorkspace } from "@/components/privacy/privacy-workspace";

export const metadata: Metadata = {
  title: "Privacy Policy | Pizza Way",
  description: "How Pizza Way collects, uses and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <NavHeader />
      <main>
        <PrivacyHero />
        <PrivacyWorkspace />
      </main>
      <SiteFooter />
    </>
  );
}
