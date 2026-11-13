"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type FormEvent } from "react";
import { useOrderHydrated } from "@/components/confirmation/confirmation-hero";
import { profileSchema, type ProfileInput } from "@/schemas/auth";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";

type FieldName = keyof ProfileInput;
type Errors = Partial<Record<FieldName, string>>;

const CONFIRM_MS = 4000;

const SECTION = "flex w-full min-w-0 flex-col items-start gap-32 max-lg:gap-[24px]";
const HEADING =
  "font-heading text-32 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(24px,4vw,30px)]";
const CARD =
  "flex w-full min-w-0 flex-col items-start gap-24 rounded-20 border-[1.5px] border-solid border-pw-line bg-white p-24 max-lg:gap-[20px] max-lg:rounded-[20px] max-lg:p-[20px] max-sm:p-[16px]";
const CARD_TITLE = "font-heading text-20 leading-[normal] font-extrabold text-pw-ink max-lg:text-[19px]";
const CARD_TEXT = "font-body text-14 leading-[1.5] font-normal text-pw-muted max-lg:text-[14px]";
const FIELD = "flex min-w-0 flex-[1_0_0] flex-col gap-8 max-lg:gap-[8px] max-sm:w-full max-sm:flex-auto";
const LABEL = "font-body text-14 leading-[normal] font-bold text-pw-ink max-lg:text-[14px]";
const CONTROL =
  "m-0 block w-full min-w-0 rounded-12 border-[1.5px] border-solid border-pw-line bg-white p-16 font-body text-15 leading-[normal] font-normal text-pw-ink outline-none transition-colors duration-150 placeholder:text-pw-muted placeholder:opacity-100 hover:border-pw-muted focus-visible:border-pw-green-700 focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-2 aria-invalid:border-pw-red-600 max-lg:min-h-[48px] max-lg:rounded-[12px] max-lg:p-[14px] max-lg:text-[16px]";
const ERROR = "font-body text-13 leading-[normal] font-medium text-pw-red-600 max-lg:text-[13px]";
const BTN =
  "inline-flex cursor-pointer items-center justify-center rounded-pill px-24 py-12 font-heading text-13 leading-[normal] font-extrabold whitespace-nowrap uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 max-lg:min-h-[44px] max-lg:px-[24px] max-lg:text-[14px] max-sm:w-full";
const STATUS = "font-body text-14 leading-[normal] font-bold text-pw-green-700 max-lg:text-[14px]";

function useAuthHydrated() {
  return useSyncExternalStore(
    (cb) => useAuthStore.persist.onFinishHydration(cb),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}

function ProfileForm() {
  const user = useAuthStore.getState().user;
  const [values, setValues] = useState<ProfileInput>({ name: user?.name ?? "", email: user?.email ?? "" });
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const name = e.target.name as FieldName;
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
    setSaved(false);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = profileSchema.safeParse(values);
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as FieldName;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setSaved(false);
      const first = (["name", "email"] as FieldName[]).find((k) => next[k]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    useAuthStore.getState().updateProfile(result.data);
    setValues(result.data);
    setSaved(true);
  }

  function a11y(name: FieldName) {
    return {
      id: `account-${name}`,
      name,
      value: values[name],
      onChange,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? `account-${name}-error` : undefined,
    } as const;
  }

  function err(name: FieldName) {
    return errors[name] ? (
      <p id={`account-${name}-error`} role="alert" className={ERROR}>
        {errors[name]}
      </p>
    ) : null;
  }

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} aria-labelledby="account-profile-title" className="m-0 flex w-full flex-col items-start gap-24 max-lg:gap-[20px]">
      <div className="flex w-full items-start gap-16 max-lg:gap-[16px] max-sm:flex-col">
        <div className={FIELD}>
          <label htmlFor="account-name" className={LABEL}>
            Full Name
          </label>
          <input {...a11y("name")} type="text" autoComplete="name" placeholder="Enter full name" className={CONTROL} />
          {err("name")}
        </div>
        <div className={FIELD}>
          <label htmlFor="account-email" className={LABEL}>
            Email Address
          </label>
          <input
            {...a11y("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="yourname@example.com"
            className={CONTROL}
          />
          {err("email")}
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center gap-16 max-lg:gap-[12px]">
        <button type="submit" className={`${BTN} border-0 bg-pw-green-700 text-white hover:bg-pw-green-600 focus-visible:ring-pw-green-700`}>
          Save changes
        </button>
        <p role="status" className={STATUS}>
          {saved ? "Profile updated." : ""}
        </p>
      </div>
    </form>
  );
}

function ClearHistory() {
  const hydrated = useOrderHydrated();
  const count = useOrderStore((s) => s.history?.length ?? 0);
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function onClick() {
    if (timer.current) clearTimeout(timer.current);
    if (!confirming) {
      setConfirming(true);
      setCleared(false);
      timer.current = setTimeout(() => setConfirming(false), CONFIRM_MS);
      return;
    }
    useOrderStore.setState({ history: [], lastOrder: null });
    setConfirming(false);
    setCleared(true);
  }

  const empty = hydrated && count === 0;

  return (
    <div className="flex w-full flex-wrap items-center gap-16 max-lg:gap-[12px]">
      <button
        type="button"
        onClick={onClick}
        disabled={!hydrated || (empty && !confirming)}
        className={`${BTN} border-[1.5px] border-solid border-pw-red-600 focus-visible:ring-pw-red-600 ${
          confirming ? "bg-pw-red-600 text-white" : "bg-white text-pw-red-600 hover:bg-pw-red-600 hover:text-white"
        }`}
      >
        {confirming ? "Click again to confirm" : "Clear my order history"}
      </button>
      <p role="status" className={STATUS}>
        {cleared ? "Order history cleared." : ""}
      </p>
    </div>
  );
}

/** Account "Settings" tab: profile details + clear local order data. Passwords are never stored. */
export function SettingsPanel() {
  const authHydrated = useAuthHydrated();

  return (
    <section aria-labelledby="account-settings-heading" className={SECTION}>
      <h2 id="account-settings-heading" className={HEADING}>
        Settings
      </h2>

      <div className="flex w-full flex-col gap-16 max-lg:gap-[16px]">
        <div className={CARD}>
          <div className="flex flex-col gap-6 max-lg:gap-[6px]">
            <h3 id="account-profile-title" className={CARD_TITLE}>
              Profile
            </h3>
            <p className={CARD_TEXT}>Your name and email are used for order updates and receipts.</p>
          </div>
          {authHydrated ? (
            <ProfileForm />
          ) : (
            <div aria-busy="true" aria-label="Loading your profile" className="h-140 w-full animate-pulse rounded-12 bg-pw-line motion-reduce:animate-none max-lg:h-[130px] max-lg:rounded-[12px]" />
          )}
        </div>

        <div className={CARD}>
          <div className="flex flex-col gap-6 max-lg:gap-[6px]">
            <h3 className={CARD_TITLE}>Data on this device</h3>
            <p className={CARD_TEXT}>
              Your orders, addresses, payment methods and favourites are kept only in this browser. Clearing your order history removes them all and cannot be undone.
            </p>
          </div>
          <ClearHistory />
        </div>
      </div>
    </section>
  );
}
