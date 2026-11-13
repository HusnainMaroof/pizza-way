"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { calcTotals, useFulfilmentStore, usePromoStore, type Fulfilment } from "@/lib/pricing";
import { checkoutFormSchema, detectCardBrand, formatPostcode, isUkPostcode } from "@/schemas/checkout";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { useOrderStore } from "@/store/order-store";

type TextField =
  | "name"
  | "email"
  | "phone"
  | "postcode"
  | "line1"
  | "line2"
  | "city"
  | "instructions"
  | "slot"
  | "cardNumber"
  | "expiry"
  | "cvc";
type Values = Record<TextField, string> & { timeMode: "asap" | "later"; saveCard: boolean };
type Errors = Partial<Record<TextField, string>>;

const EMPTY: Values = {
  name: "",
  email: "",
  phone: "",
  postcode: "",
  line1: "",
  line2: "",
  city: "",
  instructions: "",
  slot: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  timeMode: "asap",
  saveCard: false,
};

/** Focus order for the first invalid field. */
const ORDER: TextField[] = ["name", "email", "phone", "postcode", "line1", "line2", "city", "instructions", "slot", "cardNumber", "expiry", "cvc"];
const ADDRESS_FIELDS: TextField[] = ["postcode", "line1", "line2", "city", "instructions"];

const PAYMENT_DELAY_MS = 900;

const SECTION = "flex w-full flex-col items-start gap-20 max-lg:gap-[20px]";
const HEADING = "font-heading text-20 leading-[normal] font-extrabold text-pw-ink uppercase max-lg:text-[20px] max-sm:text-[18px]";
const ROW = "flex w-full items-start gap-16 max-lg:gap-[16px] max-sm:flex-col";
const FIELD = "flex min-w-0 flex-[1_0_0] flex-col items-start gap-8 max-lg:gap-[8px] max-sm:w-full max-sm:flex-auto";
const LABEL = "font-body text-13 leading-[normal] font-bold text-pw-ink max-lg:text-[14px]";
const CONTROL_BASE =
  "m-0 block w-full min-w-0 rounded-12 border-solid px-16 font-body text-14 leading-[normal] font-normal text-pw-ink outline-none transition-colors duration-150 placeholder:text-pw-muted placeholder:opacity-100 hover:border-pw-muted focus-visible:border-pw-green-700 focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-2 aria-invalid:border-pw-red-600 max-lg:rounded-[12px] max-lg:px-[16px] max-lg:text-[16px]";
/** Contact / address inputs: surface fill, 1.5px border. */
const CONTROL = `${CONTROL_BASE} h-48 border-[1.5px] border-pw-line bg-pw-surface max-lg:h-[48px]`;
/** Card inputs (inside the card panel): white fill, 1px border. */
const CARD_CONTROL = `${CONTROL_BASE} h-48 border border-pw-line bg-white tabular-nums max-lg:h-[48px]`;
const ERROR = "font-body text-13 leading-[normal] font-medium text-pw-red-600 max-lg:text-[13px]";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Time slots every 30 minutes, from +1h (rounded up to the next half hour) for the next 6 hours. */
function buildSlots(now: Date): string[] {
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  start.setSeconds(0, 0);
  const m = start.getMinutes();
  if (m !== 0 && m !== 30) start.setMinutes(m < 30 ? 30 : 60);
  const today = now.toDateString();
  const slots: string[] = [];
  for (let i = 0; i < 12; i++) {
    const t = new Date(start.getTime() + i * 30 * 60 * 1000);
    const day = t.toDateString() === today ? "Today" : "Tomorrow";
    slots.push(`${day}, ${pad(t.getHours())}:${pad(t.getMinutes())}`);
  }
  return slots;
}

const formatCardNumber = (raw: string) =>
  raw
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

const formatExpiry = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
};

const BRAND_LABEL = { visa: "Visa", mastercard: "Mastercard" } as const;

type Props = {
  /** Called right before the order is stored (the basket is cleared then), so the parent can show a redirect state. */
  onPlaced?: () => void;
};

/** Checkout form (Figma 97:1706). Submitted by the Place Order button in the summary card (`form="checkout-form"`). */
export function CheckoutForm({ onPlaced }: Props) {
  const router = useRouter();
  const mode = useFulfilmentStore((s) => s.mode);
  const setMode = useFulfilmentStore((s) => s.setMode);
  const submitting = useCheckoutStore((s) => s.submitting);

  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [hint, setHint] = useState("");
  const [formError, setFormError] = useState("");
  const [slots] = useState(() => buildSlots(new Date()));
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel a pending simulated payment and release the shared submitting flag on unmount.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      useCheckoutStore.getState().setSubmitting(false);
    },
    [],
  );

  const isDelivery = mode === "delivery";
  const n = (delivery: number, collection: number) => (isDelivery ? delivery : collection);
  const brand = detectCardBrand(values.cardNumber);

  function focusField(name: TextField) {
    formRef.current?.querySelector<HTMLElement>(`[name="${name}"]`)?.focus();
  }

  function set(name: TextField, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
    if (formError) setFormError("");
  }

  function onChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const name = e.target.name as TextField;
    let value = e.target.value;
    if (name === "cardNumber") value = formatCardNumber(value);
    else if (name === "expiry") value = formatExpiry(value);
    else if (name === "cvc") value = value.replace(/\D/g, "").slice(0, 4);
    if (name === "postcode") setHint("");
    set(name, value);
  }

  function switchMode(next: Fulfilment) {
    if (next === mode) return;
    setMode(next);
    setHint("");
    setErrors((er) => {
      const copy = { ...er };
      for (const k of ADDRESS_FIELDS) delete copy[k];
      return copy;
    });
  }

  function findAddress() {
    if (!isUkPostcode(values.postcode)) {
      setHint("");
      setErrors((er) => ({ ...er, postcode: values.postcode.trim() ? "Enter a valid UK postcode" : "Postcode is required" }));
      focusField("postcode");
      return;
    }
    const pc = formatPostcode(values.postcode);
    set("postcode", pc);
    setHint(`${pc} looks good. Enter the rest of your address below.`);
    focusField("line1");
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (useCheckoutStore.getState().submitting) return;
    setFormError("");

    const result = checkoutFormSchema.safeParse({ ...values, fulfilment: mode });
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as TextField;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const first = ORDER.find((k) => next[k]);
      if (first) focusField(first);
      return;
    }

    setErrors({});
    const d = result.data;
    const { setSubmitting } = useCheckoutStore.getState();
    setSubmitting(true);

    // Simulated payment (no backend). Card number, expiry and CVC never leave this component.
    timer.current = setTimeout(() => {
      timer.current = null;
      try {
        const items = useCartStore.getState().items;
        if (items.length === 0) {
          setSubmitting(false);
          setFormError("Your basket is empty.");
          return;
        }
        const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
        const promo = usePromoStore.getState();
        const totals = calcTotals(subtotal, promo.percent, mode);
        const cardBrand = detectCardBrand(d.cardNumber);

        onPlaced?.();
        useOrderStore.getState().place({
          items,
          totals,
          promoCode: promo.code,
          fulfilment: mode,
          deliveryTime: d.timeMode === "later" ? d.slot : "ASAP",
          customer: { name: d.name, email: d.email, phone: d.phone },
          address:
            mode === "delivery"
              ? {
                  postcode: formatPostcode(d.postcode),
                  line1: d.line1.trim(),
                  ...(d.line2.trim() ? { line2: d.line2.trim() } : {}),
                  city: d.city.trim(),
                  ...(d.instructions.trim() ? { instructions: d.instructions.trim() } : {}),
                }
              : undefined,
          payment: { method: "card", ...(cardBrand ? { brand: BRAND_LABEL[cardBrand] } : {}), last4: d.cardNumber.slice(-4) },
        });
        router.push("/order-confirmation");
      } catch {
        setSubmitting(false);
        setFormError("Something went wrong placing your order. Please try again.");
      }
    }, PAYMENT_DELAY_MS);
  }

  function a11y(name: TextField) {
    return {
      id: `checkout-${name}`,
      name,
      value: values[name],
      onChange,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? `checkout-${name}-error` : undefined,
    } as const;
  }

  function err(name: TextField) {
    return errors[name] ? (
      <p id={`checkout-${name}-error`} role="alert" className={ERROR}>
        {errors[name]}
      </p>
    ) : null;
  }

  function label(name: TextField, text: ReactNode) {
    return (
      <label htmlFor={`checkout-${name}`} className={LABEL}>
        {text}
      </label>
    );
  }

  const toggleBtn = (value: Fulfilment, text: string) => {
    const active = mode === value;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => switchMode(value)}
        className={`flex min-w-0 flex-[1_0_0] cursor-pointer items-center justify-center rounded-pill border-0 py-10 font-heading text-14 leading-[normal] font-extrabold uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-2 max-lg:min-h-[44px] max-lg:py-[10px] max-lg:text-[14px] ${
          active ? "bg-pw-green-700 text-white" : "bg-transparent text-pw-muted hover:text-pw-ink"
        }`}
      >
        {text}
      </button>
    );
  };

  const timePill = (value: "asap" | "later", text: string) => {
    const active = values.timeMode === value;
    return (
      <label
        className={`flex min-w-0 flex-[1_0_0] cursor-pointer items-center gap-8 rounded-16 border-[1.5px] border-solid p-16 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pw-green-700 has-[:focus-visible]:ring-offset-2 max-lg:min-h-[52px] max-lg:gap-[8px] max-lg:rounded-[16px] max-lg:p-[14px] max-sm:w-full max-sm:flex-auto ${
          active ? "border-pw-green-700 bg-pw-green-700 text-white" : "border-pw-line bg-pw-surface text-pw-ink hover:border-pw-muted"
        }`}
      >
        <input
          type="radio"
          name="timeMode"
          value={value}
          checked={active}
          onChange={() => {
            setValues((v) => ({ ...v, timeMode: value }));
            if (value === "asap" && errors.slot) setErrors((er) => ({ ...er, slot: undefined }));
          }}
          className="sr-only"
        />
        <Image
          src={active ? "/brand/checkout/radio-on.svg" : "/brand/checkout/radio-off.svg"}
          alt=""
          width={16}
          height={16}
          className="block size-16 shrink-0 max-lg:size-[16px]"
        />
        <span className="font-heading text-15 leading-[normal] font-bold whitespace-nowrap max-lg:text-[15px]">{text}</span>
      </label>
    );
  };

  const chip = (key: "visa" | "mastercard", text: string) => (
    <span
      className={`flex items-start rounded-[calc(4*var(--u))] border border-solid bg-white px-6 py-2 font-heading text-[length:max(9px,calc(9*var(--u)))] leading-[normal] font-extrabold text-pw-ink uppercase transition-colors max-lg:rounded-[4px] max-lg:px-[6px] max-lg:py-[2px] ${
        brand === key ? "border-pw-green-700" : "border-pw-line"
      }`}
    >
      {text}
    </span>
  );

  return (
    <form
      id="checkout-form"
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      aria-label="Checkout details"
      aria-busy={submitting || undefined}
      className="m-0 flex w-full flex-col items-start gap-40 max-lg:gap-[32px]"
    >
      {/* Delivery method */}
      <div className="flex w-full flex-col items-start gap-16 max-lg:gap-[16px]">
        <h2 id="checkout-method-title" className={HEADING}>
          Delivery Method
        </h2>
        <div
          role="group"
          aria-labelledby="checkout-method-title"
          className="flex w-340 items-start gap-4 rounded-pill border border-solid border-pw-line bg-pw-surface p-4 max-lg:w-[340px] max-lg:gap-[4px] max-lg:p-[4px] max-sm:w-full"
        >
          {toggleBtn("delivery", "Delivery")}
          {toggleBtn("collection", "Collection")}
        </div>
      </div>

      {/* 1. Contact details */}
      <fieldset className={`m-0 min-w-0 border-0 p-0 ${SECTION}`}>
        <legend className={`mb-20 p-0 max-lg:mb-[20px] ${HEADING}`}>1. Contact Details</legend>
        <div className="flex w-full flex-col gap-8 max-lg:gap-[8px]">
          {label("name", "Full Name *")}
          <input {...a11y("name")} type="text" autoComplete="name" placeholder="Enter full name" className={CONTROL} />
          {err("name")}
        </div>
        <div className={ROW}>
          <div className={FIELD}>
            {label("email", "Email Address *")}
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
          <div className={FIELD}>
            {label("phone", "Phone Number *")}
            <input
              {...a11y("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. +44 7123 456789"
              className={CONTROL}
            />
            {err("phone")}
          </div>
        </div>
      </fieldset>

      {/* 2. Delivery address (delivery only) */}
      {isDelivery && (
        <fieldset className={`m-0 min-w-0 border-0 p-0 ${SECTION}`}>
          <legend className={`mb-20 p-0 max-lg:mb-[20px] ${HEADING}`}>2. Delivery Address</legend>
          <div className="flex w-full flex-col gap-8 max-lg:gap-[8px]">
            <div className="flex w-full items-end gap-16 max-lg:gap-[16px] max-sm:flex-col max-sm:items-stretch max-sm:gap-[8px]">
              <div className={FIELD}>
                {label("postcode", "Postcode *")}
                <input
                  {...a11y("postcode")}
                  type="text"
                  autoComplete="postal-code"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={10}
                  placeholder="e.g. M1 1AE"
                  aria-describedby={
                    [errors.postcode ? "checkout-postcode-error" : "", hint ? "checkout-postcode-hint" : ""].filter(Boolean).join(" ") ||
                    undefined
                  }
                  onKeyDown={(e) => {
                    // Enter in the postcode box runs the lookup instead of submitting the whole order.
                    if (e.key === "Enter") {
                      e.preventDefault();
                      findAddress();
                    }
                  }}
                  className={CONTROL}
                />
              </div>
              <button
                type="button"
                onClick={findAddress}
                className="flex shrink-0 cursor-pointer items-center justify-center rounded-12 border-0 bg-pw-green-700 px-24 py-14 font-heading text-14 leading-[normal] font-extrabold whitespace-nowrap text-white transition-colors outline-none hover:bg-pw-green-600 focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-2 max-lg:min-h-[48px] max-lg:rounded-[12px] max-lg:px-[24px] max-lg:py-[14px] max-lg:text-[15px] max-sm:w-full"
              >
                Find Address
              </button>
            </div>
            {err("postcode")}
            <p id="checkout-postcode-hint" aria-live="polite" className={`${hint ? "" : "sr-only"} font-body text-13 leading-[normal] font-medium text-pw-green-700 max-lg:text-[13px]`}>
              {hint}
            </p>
          </div>

          <div className="flex w-full flex-col gap-8 max-lg:gap-[8px]">
            {label("line1", "Address Line 1 *")}
            <input {...a11y("line1")} type="text" autoComplete="address-line1" placeholder="House number and street" className={CONTROL} />
            {err("line1")}
          </div>

          <div className={ROW}>
            <div className={FIELD}>
              {label("line2", "Address Line 2")}
              <input {...a11y("line2")} type="text" autoComplete="address-line2" placeholder="Apartment 4B" className={CONTROL} />
              {err("line2")}
            </div>
            <div className={FIELD}>
              {label("city", "City *")}
              <input {...a11y("city")} type="text" autoComplete="address-level2" placeholder="e.g. Manchester" className={CONTROL} />
              {err("city")}
            </div>
          </div>

          <div className="flex w-full flex-col gap-8 max-lg:gap-[8px]">
            {label("instructions", "Delivery Instructions (Optional)")}
            <textarea
              {...a11y("instructions")}
              maxLength={200}
              autoComplete="off"
              placeholder="Ring buzzer 4B. Leave on the doorstep if no answer."
              className={`${CONTROL_BASE} h-80 resize-y border-[1.5px] border-pw-line bg-pw-surface py-16 max-lg:h-[96px] max-lg:py-[14px]`}
            />
            {err("instructions")}
          </div>
        </fieldset>
      )}

      {/* Delivery / collection time */}
      <fieldset className="m-0 flex w-full min-w-0 flex-col items-start gap-16 border-0 p-0 max-lg:gap-[16px]">
        <legend className={`mb-16 p-0 max-lg:mb-[16px] ${HEADING}`}>
          {n(3, 2)}. {isDelivery ? "Delivery Time" : "Collection Time"}
        </legend>
        <div className="flex w-full items-start gap-12 max-lg:gap-[12px] max-sm:flex-col">
          {timePill("asap", "ASAP (25 - 35 mins)")}
          {timePill("later", "Schedule for later")}
        </div>
        {values.timeMode === "later" && (
          <div className="flex w-full flex-col gap-8 max-lg:gap-[8px]">
            {label("slot", isDelivery ? "Delivery time *" : "Collection time *")}
            <div className="relative w-full">
              <select {...a11y("slot")} autoComplete="off" className={`${CONTROL} cursor-pointer appearance-none pr-44 max-lg:pr-[44px]`}>
                <option value="" disabled>
                  Choose a time
                </option>
                {slots.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Image
                src="/brand/contact/chevron-down.svg"
                alt=""
                width={16}
                height={16}
                className="pointer-events-none absolute top-1/2 right-16 block size-16 -translate-y-1/2 max-lg:right-[16px] max-lg:size-[16px]"
              />
            </div>
            {err("slot")}
          </div>
        )}
      </fieldset>

      {/* Payment */}
      <fieldset className={`m-0 min-w-0 border-0 p-0 ${SECTION}`}>
        <legend className={`mb-20 p-0 max-lg:mb-[20px] ${HEADING}`}>{n(4, 3)}. Payment Method</legend>
        <div className="flex w-full flex-col items-start gap-20 rounded-20 border-[1.5px] border-solid border-pw-green-700 bg-pw-surface p-24 max-lg:gap-[20px] max-lg:rounded-[20px] max-lg:p-[24px] max-sm:p-[16px]">
          <div className="flex w-full flex-wrap items-center justify-between gap-8 max-lg:gap-[8px]">
            <p className="font-heading text-16 leading-[normal] font-extrabold text-pw-ink max-lg:text-[16px]">Credit / Debit Card</p>
            <div className="flex items-start gap-8 max-lg:gap-[8px]" aria-label="Accepted cards: Visa, Mastercard" role="img">
              {chip("visa", "visa")}
              {chip("mastercard", "mastercard")}
            </div>
          </div>

          <div className="flex w-full flex-col gap-8 max-lg:gap-[8px]">
            {label("cardNumber", "Card Number")}
            <input
              {...a11y("cardNumber")}
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              spellCheck={false}
              maxLength={19}
              placeholder="1234 5678 9012 3456"
              className={CARD_CONTROL}
            />
            {err("cardNumber")}
          </div>

          <div className={ROW}>
            <div className={FIELD}>
              {label("expiry", "Expiry Date")}
              <input
                {...a11y("expiry")}
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                spellCheck={false}
                maxLength={7}
                placeholder="MM / YY"
                className={CARD_CONTROL}
              />
              {err("expiry")}
            </div>
            <div className={FIELD}>
              {label("cvc", "Security Code (CVC)")}
              <input
                {...a11y("cvc")}
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                spellCheck={false}
                maxLength={4}
                placeholder="123"
                className={CARD_CONTROL}
              />
              {err("cvc")}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-8 max-lg:min-h-[44px] max-lg:gap-[10px]">
            <input
              type="checkbox"
              name="saveCard"
              checked={values.saveCard}
              onChange={(e) => setValues((v) => ({ ...v, saveCard: e.target.checked }))}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="flex size-20 shrink-0 items-center justify-center rounded-[calc(4*var(--u))] border-[1.5px] border-solid border-pw-line bg-white transition-colors peer-checked:border-pw-green-700 peer-checked:bg-pw-green-700 peer-focus-visible:ring-2 peer-focus-visible:ring-pw-green-700 peer-focus-visible:ring-offset-2 max-lg:size-[20px] max-lg:rounded-[4px] [&>img]:invisible peer-checked:[&>img]:visible"
            >
              <Image src="/brand/checkout/check.svg" alt="" width={10} height={10} className="block size-10 max-lg:size-[10px]" />
            </span>
            <span className="font-body text-14 leading-[normal] font-normal text-pw-ink max-lg:text-[14px]">
              Save card details securely for future orders
            </span>
          </label>
        </div>
      </fieldset>

      {formError && (
        <p role="alert" className={ERROR}>
          {formError}
        </p>
      )}
    </form>
  );
}
