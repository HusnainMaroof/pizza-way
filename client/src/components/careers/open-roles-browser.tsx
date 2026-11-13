"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { ROLES } from "./roles-data";
import { RolesWorkspace } from "./roles-workspace";
import type { Role } from "./roles-types";

const ALL = "";

type SelectKey = "location" | "department" | "type";

const SELECTS: { key: SelectKey; label: string; allLabel: string }[] = [
  { key: "location", label: "Location", allLabel: "All UK Locations" },
  { key: "department", label: "Department", allLabel: "All Departments" },
  { key: "type", label: "Job Type", allLabel: "All Job Types" },
];

function uniqueSorted(roles: Role[], key: SelectKey) {
  return Array.from(new Set(roles.map((r) => r[key]))).sort((a, b) => a.localeCompare(b));
}

const OPTIONS: Record<SelectKey, string[]> = {
  location: uniqueSorted(ROLES, "location"),
  department: uniqueSorted(ROLES, "department"),
  type: uniqueSorted(ROLES, "type"),
};

const LABEL =
  "whitespace-nowrap font-body text-13 leading-[normal] font-bold text-pw-ink max-lg:text-[14px]";
const CONTROL =
  "w-full rounded-12 border-[1.5px] border-solid border-pw-line bg-white py-14 font-body text-14 leading-[normal] text-pw-ink outline-none focus-visible:border-pw-green-700 max-lg:min-h-[48px] max-lg:rounded-[12px] max-lg:py-[12px] max-lg:text-[15px] max-sm:text-[16px]";

/** Open Roles: filters bar (Figma 186:34) + filtered roles workspace. */
export function OpenRolesBrowser() {
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<Record<SelectKey, string>>({
    location: ALL,
    department: ALL,
    type: ALL,
  });
  const resultsRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ROLES.filter((r) => {
      if (values.location && r.location !== values.location) return false;
      if (values.department && r.department !== values.department) return false;
      if (values.type && r.type !== values.type) return false;
      if (!q) return true;
      return [r.title, r.department, r.location, r.summary].some((f) =>
        f.toLowerCase().includes(q),
      );
    });
  }, [query, values]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section
        aria-label="Filter open roles"
        className="flex w-full items-start border-b-[1.5px] border-solid border-pw-line bg-white px-80 py-48 max-lg:px-[40px] max-lg:py-[32px] max-sm:px-[20px] max-sm:py-[24px]"
      >
        <form
          role="search"
          onSubmit={onSubmit}
          className="flex min-w-0 flex-[1_0_0] items-end gap-24 max-lg:flex-wrap max-lg:gap-[16px] max-sm:flex-col max-sm:items-stretch max-sm:gap-[14px]"
        >
          <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-6 max-lg:basis-full max-lg:gap-[6px] max-sm:flex-none">
            <label htmlFor="open-roles-search" className={LABEL}>
              Keywords
            </label>
            <div className="relative w-full">
              <img
                src="/brand/careers/filter-search.svg"
                alt=""
                width={16}
                height={16}
                className="pointer-events-none absolute top-1/2 left-16 size-16 -translate-y-1/2 max-lg:left-[16px] max-lg:size-[16px]"
              />
              <input
                id="open-roles-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roles e.g. Pizza Chef, Delivery..."
                autoComplete="off"
                className={`${CONTROL} pr-16 pl-44 placeholder:text-pw-muted max-lg:pr-[16px] max-lg:pl-[44px]`}
              />
            </div>
          </div>

          {SELECTS.map((s) => {
            const id = `open-roles-${s.key}`;
            return (
              <div
                key={s.key}
                className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-6 max-lg:min-w-[180px] max-lg:gap-[6px] max-sm:min-w-0 max-sm:flex-none"
              >
                <label htmlFor={id} className={LABEL}>
                  {s.label}
                </label>
                <div className="relative w-full">
                  <select
                    id={id}
                    value={values[s.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                    className={`${CONTROL} cursor-pointer appearance-none truncate pr-40 pl-16 font-medium max-lg:pr-[40px] max-lg:pl-[16px]`}
                  >
                    <option value={ALL}>{s.allLabel}</option>
                    {OPTIONS[s.key].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <img
                    src="/brand/careers/filter-chevron-down.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="pointer-events-none absolute top-1/2 right-16 size-16 -translate-y-1/2 max-lg:right-[16px] max-lg:size-[16px]"
                  />
                </div>
              </div>
            );
          })}

          <button
            type="submit"
            className="inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-pill bg-pw-green-700 px-28 py-14 font-heading text-14 leading-[normal] font-extrabold text-white uppercase max-lg:min-h-[48px] max-lg:px-[28px] max-lg:py-[14px] max-lg:text-[14px] max-sm:w-full"
          >
            Filter Roles
          </button>
        </form>
      </section>

      <div ref={resultsRef} className="w-full scroll-mt-[80px]">
        <RolesWorkspace roles={filtered} total={ROLES.length} />
      </div>
    </>
  );
}
