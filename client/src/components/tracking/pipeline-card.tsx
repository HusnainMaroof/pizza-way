import Image from "next/image";
import { COLLECTION_STAGE_TEXT, TRACKING_STAGES, formatClock, type TrackingState } from "@/lib/tracking";

function minutesLabel(n: number) {
  return `${n} ${n === 1 ? "Minute" : "Minutes"}`;
}

/** "Baking & Transit Pipeline" card (Figma 97:2086): ETA + 4-step live timeline. */
export function PipelineCard({ state, collection }: { state: TrackingState; collection: boolean }) {
  const stages = TRACKING_STAGES.map((s) =>
    collection && (s.id === "transit" || s.id === "delivered") ? { ...s, ...COLLECTION_STAGE_TEXT[s.id] } : s,
  );

  const etaLabel = collection ? "Ready in:" : "Estimated Arrival:";
  const etaValue = state.done ? (collection ? "Ready" : "Arrived") : minutesLabel(state.etaMinutes);

  return (
    <section
      aria-labelledby="pipeline-heading"
      className="flex w-full flex-col items-start gap-32 rounded-32 border-[1.5px] border-solid border-pw-line bg-white p-40 max-lg:gap-[24px] max-lg:rounded-[24px] max-lg:p-[32px] max-sm:rounded-[20px] max-sm:p-[20px]"
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-x-24 gap-y-8 leading-[normal] max-lg:gap-y-[8px]">
        <h2 id="pipeline-heading" className="font-heading text-24 leading-[normal] font-black text-pw-ink max-lg:text-[22px] max-sm:text-[20px]">
          Baking &amp; Transit Pipeline
        </h2>
        <p aria-live="polite" className="flex items-center gap-8 whitespace-nowrap max-lg:gap-[8px]">
          {!state.done && <span className="font-body text-14 leading-[normal] font-normal text-pw-muted max-lg:text-[14px]">{etaLabel}</span>}
          <span className="font-heading text-18 leading-[normal] font-black text-pw-green-700 max-lg:text-[18px]">{etaValue}</span>
        </p>
      </div>

      <ol className="flex w-full flex-col items-start gap-24 max-lg:gap-[20px]">
        {stages.map((stage, i) => {
          const complete = i < state.active || (i === state.active && state.done);
          const current = i === state.active && !state.done;
          const upcoming = i > state.active;
          const started = state.startedAt[i];

          return (
            <li
              key={stage.id}
              aria-current={current ? "step" : undefined}
              className="flex w-full items-start gap-24 max-lg:gap-[16px] max-sm:gap-[12px]"
            >
              <div className="flex w-40 shrink-0 flex-col items-center max-lg:w-[32px]">
                <div
                  className={`flex size-32 items-center justify-center rounded-pill max-lg:size-[30px] ${
                    complete ? "bg-pw-green-700" : current ? "bg-pw-green-500" : "bg-pw-line"
                  }`}
                >
                  {complete ? (
                    <Image src="/brand/tracking/check.svg" alt="" width={16} height={16} className="block size-16 max-lg:size-[15px]" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`font-heading text-14 leading-[normal] font-black max-lg:text-[14px] ${current ? "text-pw-ink" : "text-pw-muted"}`}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
              </div>

              <div className={`flex min-w-0 flex-[1_0_0] flex-col items-start gap-4 wrap-break-word max-lg:gap-[4px] ${upcoming ? "text-pw-muted" : "text-pw-ink"}`}>
                <div className="flex w-full items-center justify-between gap-16 leading-[normal] max-sm:flex-col max-sm:items-start max-sm:gap-[2px]">
                  <h3 className="font-heading text-18 leading-[normal] font-extrabold max-lg:text-[17px]">
                    <span className="sr-only">{complete ? "Completed: " : current ? "In progress: " : "Upcoming: "}</span>
                    {stage.title}
                  </h3>
                  <p className="shrink-0 font-body text-13 leading-[normal] font-normal whitespace-nowrap text-pw-muted max-lg:text-[13px]">
                    {started ? <time dateTime={started.toISOString()}>{formatClock(started)}</time> : formatClock(null)}
                  </p>
                </div>
                <p className="w-full font-body text-14 leading-20 font-normal text-pw-muted max-lg:text-[14px] max-lg:leading-[20px]">
                  {stage.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
