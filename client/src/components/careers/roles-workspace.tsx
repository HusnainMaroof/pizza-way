import Link from "next/link";
import type { ReactNode } from "react";
import type { Role } from "./roles-types";

const TAG =
  "inline-flex items-start rounded-pill px-12 py-6 font-heading text-11 font-extrabold uppercase leading-[normal] whitespace-nowrap max-lg:px-[12px] max-lg:py-[6px] max-lg:text-[11px]";

const APPLY =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-pill bg-pw-green-700 px-24 py-10 font-heading text-13 font-extrabold uppercase leading-[normal] text-white no-underline transition-colors hover:bg-pw-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[44px] max-lg:px-[24px] max-lg:py-[12px] max-lg:text-[13px] max-sm:w-full";

function countText(shown: number, total: number) {
  const noun = total === 1 ? "position" : "positions";
  return shown === total
    ? `Currently tracking ${total} open ${noun} across the UK network.`
    : `Showing ${shown} of ${total} open ${noun} across the UK network.`;
}

/** Static "Sort by: Most Recent" control from the design (Figma 186:67). */
function DefaultSort() {
  return (
    <div className="flex items-center gap-8 max-lg:gap-[8px]">
      <span className="font-body text-14 font-medium leading-[normal] text-pw-muted max-lg:text-[14px]">Sort by:</span>
      <span className="inline-flex items-center gap-8 rounded-[calc(8*var(--u))] border border-solid border-pw-line bg-white py-8 pr-12 pl-16 max-lg:min-h-[44px] max-lg:gap-[8px] max-lg:rounded-[8px] max-lg:py-[8px] max-lg:pr-[12px] max-lg:pl-[16px]">
        <span className="font-body text-14 font-bold leading-[normal] text-pw-ink max-lg:text-[14px]">Most Recent</span>
        <img
          src="/brand/careers/open-roles-chevron-down.svg"
          alt=""
          width={14}
          height={14}
          className="size-14 shrink-0 max-lg:size-[14px]"
        />
      </span>
    </div>
  );
}

function RoleCard({ role }: { role: Role }) {
  const titleId = `role-${role.id}-title`;
  return (
    <article
      aria-labelledby={titleId}
      className="flex w-full flex-col items-start gap-20 rounded-24 border-[1.5px] border-solid border-pw-line bg-white p-32 drop-shadow-[0px_4px_8px_rgba(19,28,19,0.03)] max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[24px] max-sm:p-[20px]"
    >
      <div className="flex w-full flex-col items-start gap-12 max-lg:gap-[10px]">
        <div className="flex w-full flex-wrap items-center gap-8 max-lg:gap-[8px]">
          <span className={`${TAG} bg-pw-green-100 text-pw-green-700`}>{role.department}</span>
          <span className={`${TAG} bg-[#f0f2f0] text-pw-muted`}>{role.type}</span>
        </div>
        <h3
          id={titleId}
          className="w-full font-heading text-24 font-black leading-[normal] text-pw-ink max-lg:text-[20px] max-lg:leading-[1.2] max-sm:text-[19px]"
        >
          {role.title}
        </h3>
        <p className="flex w-full items-center gap-6 font-body text-14 font-medium leading-[normal] text-pw-muted max-lg:gap-[6px] max-lg:text-[14px]">
          <img
            src="/brand/careers/open-roles-map-pin.svg"
            alt=""
            width={16}
            height={16}
            className="size-16 shrink-0 max-lg:size-[16px]"
          />
          <span className="min-w-0">{role.location}</span>
        </p>
      </div>

      <p className="w-full font-body text-15 font-normal leading-22 text-pw-muted max-lg:text-[15px] max-lg:leading-[1.55]">
        {role.summary}
      </p>

      <div className="flex w-full items-center justify-between gap-16 max-sm:flex-col max-sm:items-stretch max-sm:gap-[14px]">
        {role.posted ? (
          <p className="flex items-center gap-6 font-body text-13 font-normal leading-[normal] whitespace-nowrap text-pw-muted max-lg:gap-[6px] max-lg:text-[13px]">
            <img
              src="/brand/careers/open-roles-clock.svg"
              alt=""
              width={16}
              height={16}
              className="size-16 shrink-0 max-lg:size-[16px]"
            />
            <span>
              <span className="sr-only">Posted </span>
              {role.posted}
            </span>
          </p>
        ) : (
          <span />
        )}
        <Link href={`/careers/open-roles?apply=${role.id}`} aria-label={`Apply now for ${role.title}`} className={APPLY}>
          Apply Now
        </Link>
      </div>
    </article>
  );
}

/**
 * Open Roles: Main Workspace (Figma 186:62). Presentational (no state).
 * `sortControl` lets the client wrapper swap in a real sort control; defaults to the static design control.
 */
export function RolesWorkspace({
  roles,
  total,
  sortControl,
}: {
  roles: Role[];
  total: number;
  sortControl?: ReactNode;
}) {
  return (
    <section
      className="flex w-full flex-col items-start gap-40 bg-pw-surface p-80 [word-break:break-word] max-lg:gap-[28px] max-lg:px-[40px] max-lg:py-[56px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[40px]"
      aria-labelledby="open-roles-results-title"
    >
      <div className="flex w-full items-center justify-between gap-24 max-sm:flex-col max-sm:items-start max-sm:gap-[16px]">
        <div className="flex min-w-0 flex-col items-start gap-8 leading-[normal] max-lg:gap-[6px]">
          <h2
            id="open-roles-results-title"
            className="font-heading text-32 font-black leading-[normal] text-pw-ink max-lg:text-[length:clamp(24px,4vw,30px)] max-lg:leading-[1.15]"
          >
            Active Opportunities
          </h2>
          <p
            aria-live="polite"
            className="font-body text-15 font-normal leading-[normal] text-pw-muted max-lg:text-[15px] max-lg:leading-[1.5]"
          >
            {countText(roles.length, total)}
          </p>
        </div>
        <div className="shrink-0">{sortControl ?? <DefaultSort />}</div>
      </div>

      {roles.length === 0 ? (
        <div className="flex w-full items-center justify-center rounded-24 border-[1.5px] border-dashed border-pw-line bg-white p-48 text-center max-lg:rounded-[20px] max-lg:p-[32px] max-sm:p-[24px]">
          <p className="font-body text-16 font-medium leading-[normal] text-pw-muted max-lg:text-[16px]">
            No roles match your filters.
          </p>
        </div>
      ) : (
        <ul className="grid w-full grid-cols-2 gap-24 max-lg:gap-[16px] max-sm:grid-cols-1">
          {roles.map((role) => (
            <li key={role.id} className="flex min-w-0 flex-col self-start">
              <RoleCard role={role} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
