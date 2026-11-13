import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { ContactHero } from "@/components/contact/contact-hero";
import { FaqSection } from "@/components/contact/faq-section";
import { HelpCards } from "@/components/contact/help-cards";
import { MainWorkspace } from "@/components/contact/main-workspace";

export const metadata: Metadata = {
  title: "Contact | Pizza Way",
  description: "Get in touch with Pizza Way: send a message, find our contact details and read the FAQ.",
};

export default function ContactPage() {
  return (
    <>
      <NavHeader />
      <main>
        <ContactHero />
        <HelpCards />
        <MainWorkspace />
        <FaqSection />
      </main>
      <SiteFooter />
    </>
  );
}
