"use client";

import Image from "next/image";
import { useState, type ComponentType } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useAuthHydrated } from "@/lib/use-hydrated";
import { LoginSection } from "@/components/auth/login-section";
import { OrdersPanel } from "@/components/account/orders-panel";
import { AddressesPanel } from "@/components/account/addresses-panel";
import { PaymentsPanel } from "@/components/account/payments-panel";
import { FavouritesPanel } from "@/components/account/favourites-panel";
import { SettingsPanel } from "@/components/account/settings-panel";

type TabId = "orders" | "addresses" | "payments" | "favourites" | "settings";

/** `white`: the source SVG is drawn white (needs darkening when inactive). */
const TABS: { id: TabId; label: string; icon: string; white?: boolean }[] = [
  { id: "orders", label: "My Orders", icon: "/brand/account/shopping-bag.svg", white: true },
  { id: "addresses", label: "My Addresses", icon: "/brand/account/map-pin.svg" },
  { id: "payments", label: "Payment Methods", icon: "/brand/account/credit-card.svg" },
  { id: "favourites", label: "My Favourites", icon: "/brand/account/star.svg" },
  { id: "settings", label: "Settings", icon: "/brand/account/settings.svg" },
];

const PANELS: Record<TabId, ComponentType> = {
  orders: OrdersPanel,
  addresses: AddressesPanel,
  payments: PaymentsPanel,
  favourites: FavouritesPanel,
  settings: SettingsPanel,
};

const contentClass =
  "flex w-full items-start gap-48 bg-pw-surface p-80 max-lg:flex-col max-lg:gap-[28px] max-lg:px-[40px] max-lg:py-[48px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[32px]";

const headerClass =
  "flex w-full flex-col items-start gap-12 bg-pw-green-900 px-80 pt-64 pb-40 leading-[normal] wrap-break-word max-lg:gap-[10px] max-lg:px-[40px] max-lg:pt-[48px] max-lg:pb-[36px] max-sm:px-[20px] max-sm:pt-[36px] max-sm:pb-[28px]";

const tabBase =
  "flex w-full items-center gap-12 rounded-12 px-20 py-12 text-left font-heading text-15 leading-[normal] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[44px] max-lg:gap-[10px] max-lg:rounded-[12px] max-lg:px-[14px] max-lg:py-[10px] max-lg:text-[14px]";

function TabIcon({ src, className }: { src: string; className?: string }) {
  return (
    <Image src={src} alt="" width={16} height={16} className={`block size-16 shrink-0 max-lg:size-[16px] ${className ?? ""}`} />
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your account">
      <div className={`${headerClass} h-229 max-lg:h-auto`}>
        <div className="h-20 w-200 animate-pulse rounded-6 bg-pw-green-700 motion-reduce:animate-none max-lg:h-[20px] max-lg:w-[180px]" />
        <div className="h-60 w-320 max-w-full animate-pulse rounded-12 bg-pw-green-700 motion-reduce:animate-none max-lg:h-[44px] max-lg:w-[260px]" />
        <div className="h-20 w-560 max-w-full animate-pulse rounded-6 bg-pw-green-700 motion-reduce:animate-none max-lg:h-[20px]" />
      </div>
      <div className={`${contentClass} min-h-508`}>
        <div className="h-348 w-280 shrink-0 animate-pulse rounded-24 bg-pw-line motion-reduce:animate-none max-lg:h-[104px] max-lg:w-full max-lg:rounded-[20px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-32 max-lg:w-full max-lg:gap-[24px]">
          <div className="h-40 w-260 animate-pulse rounded-12 bg-pw-line motion-reduce:animate-none max-lg:h-[32px] max-lg:w-[200px]" />
          <div className="h-136 w-full animate-pulse rounded-20 bg-pw-line motion-reduce:animate-none max-lg:h-[130px]" />
          <div className="h-136 w-full animate-pulse rounded-20 bg-pw-line motion-reduce:animate-none max-lg:h-[130px]" />
        </div>
      </div>
    </div>
  );
}

/** Account page (Figma 97:2782): greeting header + sidebar tabs + active panel. Shows the login card when signed out. */
export function AccountDashboard() {
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<TabId>("orders");

  if (!hydrated) return <DashboardSkeleton />;
  if (!user) return <LoginSection redirectTo="/account" />;

  const firstName = user.name?.trim().split(/\s+/)[0] || "there";
  const Panel = PANELS[tab];

  function signOut() {
    setTab("orders");
    useAuthStore.getState().signOut();
  }

  return (
    <div>
      <header className={headerClass}>
        <p className="font-heading text-16 leading-[normal] font-extrabold text-pw-green-500 uppercase max-lg:text-[14px]">
          PizzaWay UK Account
        </p>
        <h1 className="max-w-full font-heading text-48 leading-[normal] font-black text-white max-lg:text-[length:clamp(28px,5.5vw,44px)] max-sm:text-[length:clamp(26px,8.5vw,34px)]">
          Hey, {firstName}!
        </h1>
        <p className="font-body text-16 leading-[normal] font-normal text-pw-green-100 max-lg:text-[15px] max-lg:leading-[1.45]">
          Configure your neapolitan sourdough preferences and view delivery telemetry.
        </p>
      </header>

      <div className={contentClass}>
        <nav
          aria-label="Account sections"
          className="flex w-280 shrink-0 flex-col items-start gap-8 rounded-24 border-[1.5px] border-solid border-pw-line bg-white p-16 max-lg:grid max-lg:w-full max-lg:grid-cols-3 max-lg:gap-[8px] max-lg:rounded-[20px] max-lg:p-[10px] max-sm:grid-cols-2"
        >
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                aria-current={active ? "page" : undefined}
                aria-controls="account-panel"
                onClick={() => setTab(t.id)}
                className={`${tabBase} ${active ? "bg-pw-green-700 text-white" : "bg-white text-pw-ink hover:bg-pw-surface"}`}
              >
                <TabIcon src={t.icon} className={active ? (t.white ? "" : "brightness-0 invert") : t.white ? "brightness-0" : ""} />
                <span className="min-w-0 flex-1 wrap-break-word">{t.label}</span>
              </button>
            );
          })}
          <button type="button" onClick={signOut} className={`${tabBase} bg-white text-pw-ink hover:bg-pw-surface`}>
            <TabIcon src="/brand/account/log-out.svg" />
            <span className="min-w-0 flex-1 wrap-break-word">Sign Out</span>
          </button>
        </nav>

        <div id="account-panel" className="flex min-w-0 flex-1 flex-col items-start max-lg:w-full">
          <Panel />
        </div>
      </div>
    </div>
  );
}
