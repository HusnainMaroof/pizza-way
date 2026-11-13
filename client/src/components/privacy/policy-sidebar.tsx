"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PRIVACY_SECTIONS } from "./privacy-data";

/** Privacy Policy: Policy Sidebar Index (Figma 184:255). Highlights the section nearest the top. */
export function PolicySidebar() {
  const [activeId, setActiveId] = useState(PRIVACY_SECTIONS[0].id);

  useEffect(() => {
    const visible = new Set<string>();
    const order = PRIVACY_SECTIONS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = order.find((id) => visible.has(id));
        if (first) setActiveId(first);
      },
      // A band near the top of the viewport: the section crossing it is the active one.
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 },
    );
    for (const id of order) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Privacy policy sections"
      className="w-300 shrink-0 self-start lg:sticky lg:top-120 max-lg:w-full max-lg:shrink"
    >
      <div className="flex w-full flex-col items-start gap-16 rounded-24 border-[1.5px] border-solid border-pw-line bg-white p-24 max-lg:gap-[14px] max-lg:rounded-[20px] max-lg:p-[20px] max-sm:p-[16px]">
        <p className="font-heading text-14 leading-[normal] font-extrabold text-pw-green-700 uppercase max-lg:text-[14px]">
          Document Index
        </p>
        <ol className="m-0 grid w-full list-none grid-cols-1 gap-4 p-0 max-lg:grid-cols-2 max-lg:gap-x-[8px] max-lg:gap-y-[4px] max-sm:grid-cols-1">
          {PRIVACY_SECTIONS.map((section, i) => {
            const active = section.id === activeId;
            return (
              <li key={section.id} className="w-full">
                <a
                  href={`#${section.id}`}
                  onClick={() => setActiveId(section.id)}
                  aria-current={active ? "location" : undefined}
                  className={`flex w-full items-center gap-8 rounded-12 px-16 py-12 font-heading text-15 leading-[normal] no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[44px] max-lg:gap-[8px] max-lg:rounded-[12px] max-lg:px-[14px] max-lg:py-[10px] max-lg:text-[15px] ${
                    active
                      ? "bg-pw-green-700/7 font-bold text-pw-green-700"
                      : "font-medium text-pw-ink hover:bg-pw-surface"
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="h-16 w-4 shrink-0 rounded-[calc(2*var(--u))] bg-pw-green-700 max-lg:h-[16px] max-lg:w-[4px] max-lg:rounded-[2px]"
                    />
                  )}
                  <span className="min-w-0 flex-1 break-words">
                    {i + 1}. {section.navLabel}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
        <img
          src="/brand/privacy/sidebar-divider.svg"
          alt=""
          width={252}
          height={1}
          className="block h-px w-full"
        />
        <p className="w-full font-body text-13 leading-18 font-normal text-pw-muted max-lg:text-[13px] max-lg:leading-[1.5]">
          Need a physical copy? You can print this page or request a PDF by{" "}
          <Link href="/contact" className="text-pw-muted underline-offset-2 hover:text-pw-green-700 hover:underline">
            contacting support
          </Link>
          .
        </p>
      </div>
    </nav>
  );
}
