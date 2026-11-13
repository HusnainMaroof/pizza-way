import type { Metadata } from "next";
import { NavHeader } from "@/components/home/nav-header";
import { SiteFooter } from "@/components/home/site-footer";
import { AccountDashboard } from "@/components/account/account-dashboard";

export const metadata: Metadata = {
  title: "My Account | Pizza Way",
  description: "Your Pizza Way orders, addresses, favourites and settings.",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <>
      <NavHeader />
      <main>
        <AccountDashboard />
      </main>
      <SiteFooter />
    </>
  );
}
