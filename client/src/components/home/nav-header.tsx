"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/logo";
import { useCartStore } from "@/store/cart-store";
import { DUR, EASE_OUT, SPRING_SNAPPY } from "@/components/motion/tokens";

const NAV_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/deals", label: "Deals" },
  { href: "/build-your-pizza", label: "Build Your Pizza" },
  { href: "/locations", label: "Locations" },
  { href: "/about", label: "About" },
];

const LINK =
  "font-heading font-semibold text-15 leading-[normal] text-white no-underline whitespace-nowrap";

// Desktop link underline: a pseudo-element that scales in from the left (transform only, no layout change).
const LINK_UNDERLINE =
  "relative after:pointer-events-none after:absolute after:left-0 after:right-0 after:-bottom-[4px] after:h-[2px] after:rounded-[2px] after:bg-pw-green-500 after:origin-left after:scale-x-0 after:transition-[scale] after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none";

const PILL_MOTION =
  "transition-[translate,scale] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-[2px] motion-safe:active:scale-[0.97]";

// Sticky header scroll thresholds (px).
const SCROLLED_AT = 24;
const HIDE_AFTER = 240;

// Hamburger line (only visible <= 1023px, the toggle is hidden on desktop).
const MENU_LINE =
  "absolute left-0 w-full h-[2.5px] rounded-[2px] bg-current transition-[rotate,opacity,top] duration-200 ease-[ease]";

const MOBILE_LINK =
  "flex items-center min-h-[48px] px-[8px] border-b border-white/8 font-heading font-semibold text-[17px] text-white no-underline hover:text-pw-green-500 focus-visible:text-pw-green-500";

/** `sticky`: pins the header to the top with a scroll-aware shrink/shadow (used on the home and menu pages only). */
export function NavHeader({ sticky = false }: { sticky?: boolean } = {}) {
  const cartCount = useCartStore((st) => st.items.reduce((n, it) => n + it.qty, 0));
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const [scrolled, setScrolled] = useState(false);
  const [tucked, setTucked] = useState(false); // hidden while scrolling down

  // Sticky only: track scroll (passive listener, one read per frame) for the shadow/logo state and hide-on-scroll-down.
  useEffect(() => {
    if (!sticky) return;
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > SCROLLED_AT);
      if (y <= SCROLLED_AT) setTucked(false);
      else if (y > lastY + 4 && y > HIDE_AFTER) setTucked(true);
      else if (y < lastY - 4) setTucked(false);
      if (Math.abs(y - lastY) > 4 || y <= SCROLLED_AT) lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sticky]);

  const hidden = sticky && tucked && !open;

  // Publish the hidden state so sticky bars under the header (e.g. the menu filter bar) can slide up with it.
  useEffect(() => {
    if (!sticky) return;
    const root = document.documentElement;
    root.dataset.headerHidden = hidden ? "true" : "false";
    return () => {
      delete root.dataset.headerHidden;
    };
  }, [sticky, hidden]);
  const headerClass = sticky
    ? `sticky top-0 z-50 w-full transition-[translate,background-color,box-shadow,backdrop-filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        scrolled
          ? "bg-pw-green-950/90 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          : "bg-pw-green-950 shadow-[0_8px_24px_rgba(0,0,0,0)]"
      } ${hidden ? "-translate-y-full" : "translate-y-0"}`
    : "w-full bg-pw-green-950 max-lg:relative max-lg:z-50";

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={headerClass} onFocusCapture={sticky ? () => setTucked(false) : undefined}>
      <div className="box-content h-100 mx-auto px-80 flex items-center justify-between max-lg:h-[72px] max-lg:px-[40px] max-sm:h-[64px] max-sm:px-[20px]">
        {/* Figma box 180x38; the SVG (194x40.5) overflows it like the design */}
        <Link
          href="/"
          className={`flex items-start w-180 h-38 pt-0.5 shrink-0 max-lg:w-auto max-lg:h-auto max-lg:pt-0 origin-left transition-[scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            sticky && scrolled ? "scale-90" : ""
          }`}
          aria-label="Pizza Way home"
          onClick={close}
        >
          <Logo className="block w-194 h-auto shrink-0 max-lg:w-[160px] max-sm:w-[136px]" />
        </Link>

        <nav className="flex items-center gap-32 max-lg:hidden" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`${LINK} ${LINK_UNDERLINE}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-20 max-lg:gap-[8px]">
          <Link href="/account" className={`${LINK} ${LINK_UNDERLINE} max-lg:hidden`}>
            Account
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-8 no-underline max-lg:min-w-[44px] max-lg:min-h-[44px] max-lg:justify-center max-lg:gap-[6px]"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            onClick={close}
          >
            <Image src="/brand/icons/shopping-bag.svg" alt="" width={20} height={20} className="block" />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 1.25 }}
                animate={{ scale: 1 }}
                transition={SPRING_SNAPPY}
                className="flex items-start py-2 px-6 rounded-10 bg-pw-green-500 font-heading font-extrabold text-11 leading-[normal] text-white whitespace-nowrap max-lg:py-[2px] max-lg:px-[7px] max-lg:rounded-[10px]">
                {cartCount}
              </motion.span>
            )}
          </Link>
          <Link
            href="/menu"
            className={`flex items-center justify-center py-10 px-20 rounded-pill bg-pw-red-600 font-heading font-extrabold text-13 leading-[normal] text-white uppercase no-underline whitespace-nowrap max-lg:hidden ${PILL_MOTION}`}
          >
            Order Now
          </Link>
          <button
            type="button"
            className="hidden items-center justify-center w-[44px] h-[44px] -mr-[10px] p-0 border-0 rounded-[12px] bg-transparent text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-500 max-lg:flex"
            aria-expanded={open}
            aria-controls="pw-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block w-[24px] h-[18px]" aria-hidden="true">
              <span className={`${MENU_LINE} ${open ? "top-[7.75px] rotate-45" : "top-0"}`} />
              <span className={`${MENU_LINE} top-[7.75px] ${open ? "opacity-0" : ""}`} />
              <span className={`${MENU_LINE} ${open ? "top-[7.75px] -rotate-45" : "top-[15.5px]"}`} />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            key="pw-mobile-menu"
            id="pw-mobile-menu"
            className="hidden absolute top-full inset-x-0 flex-col gap-[4px] pt-[12px] px-[40px] pb-[24px] bg-pw-green-950 border-t border-white/10 rounded-b-24 shadow-[0_16px_32px_rgba(0,0,0,0.3)] max-sm:px-[20px] max-lg:flex"
            aria-label="Mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: DUR.fast, ease: EASE_OUT } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE_OUT } }}
          >
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={MOBILE_LINK} onClick={close}>
                {link.label}
              </Link>
            ))}
            <Link href="/account" className={MOBILE_LINK} onClick={close}>
              Account
            </Link>
            <Link
              href="/menu"
              className="flex items-center justify-center min-h-[52px] mt-[16px] rounded-pill bg-pw-red-600 font-heading font-extrabold text-[16px] text-white uppercase no-underline"
              onClick={close}
            >
              Order Now
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
