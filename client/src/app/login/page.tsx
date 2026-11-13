import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { LoginSection } from "@/components/auth/login-section";

export const metadata: Metadata = {
  title: "Sign In | Pizza Way",
  description: "Sign in or create your Pizza Way account.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <>
      <NavHeader />
      <main>
        <LoginSection redirectTo="/account" />
      </main>
      <SiteFooter />
    </>
  );
}
