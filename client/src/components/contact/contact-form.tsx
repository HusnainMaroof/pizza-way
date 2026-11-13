"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { CONTACT_SUBJECTS, contactSchema } from "@/schemas/contact";

type FieldName = "name" | "email" | "phone" | "subject" | "message";
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;

const EMPTY: Values = { name: "", email: "", phone: "", subject: "", message: "" };

const FIELD = "flex min-w-0 flex-[1_0_0] flex-col gap-8 max-sm:flex-auto max-sm:w-full";
const LABEL = "font-body font-bold text-14 leading-[normal] text-pw-ink max-lg:text-[14px]";
const CONTROL =
  "block w-full min-w-0 m-0 p-16 bg-white border-[1.5px] border-solid border-pw-line rounded-12 font-body font-normal text-15 leading-[normal] text-pw-ink placeholder:text-pw-muted placeholder:opacity-100 outline-none transition-colors duration-150 hover:border-pw-muted focus-visible:border-pw-green-700 focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-2 aria-invalid:border-pw-red-600 max-lg:min-h-[48px] max-lg:p-[14px] max-lg:rounded-[12px] max-lg:text-[16px]";
const ERROR = "font-body font-medium text-13 leading-[normal] text-pw-red-600 max-lg:text-[13px]";
const BUTTON =
  "inline-flex items-center justify-center px-32 py-16 border-0 rounded-pill bg-pw-green-700 cursor-pointer font-heading font-extrabold text-15 leading-[normal] uppercase whitespace-nowrap text-white transition-colors duration-150 hover:bg-pw-green-600 outline-none focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 max-lg:min-h-[48px] max-lg:px-[28px] max-lg:py-[14px] max-lg:text-[15px] max-sm:w-full";

/** Contact form (Figma 97:2595). No backend yet: validates with zod, then simulates a send. */
export function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  function onChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const name = e.target.name as FieldName;
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const result = contactSchema.safeParse(values);
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as FieldName;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const first = (Object.keys(EMPTY) as FieldName[]).find((k) => next[k]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    timer.current = setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 900);
  }

  function reset() {
    setValues(EMPTY);
    setErrors({});
    setSent(false);
  }

  function a11y(name: FieldName) {
    return {
      id: `contact-${name}`,
      name,
      value: values[name],
      onChange,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
    } as const;
  }

  function err(name: FieldName) {
    return errors[name] ? (
      <p id={`contact-${name}-error`} role="alert" className={ERROR}>
        {errors[name]}
      </p>
    ) : null;
  }

  return (
    <div id="contact-form" className="scroll-mt-120 flex w-760 shrink-0 flex-col items-start gap-24 max-lg:w-full max-lg:gap-[20px]">
      <h2
        id="contact-form-title"
        className="font-heading font-black text-32 leading-[normal] text-pw-ink max-lg:text-[28px] max-sm:text-[24px]"
      >
        Send Us a Message
      </h2>

      {sent ? (
        <div
          className="flex w-full flex-col items-start gap-16 p-40 bg-pw-green-100 border-[1.5px] border-solid border-pw-green-700 rounded-24 max-lg:p-[28px] max-lg:rounded-[20px] max-sm:p-[20px]"
          role="status"
        >
          <h3
            ref={successRef}
            tabIndex={-1}
            className="font-heading font-extrabold text-24 leading-[normal] text-pw-green-900 outline-none max-lg:text-[22px]"
          >
            Thanks, we&apos;ll reply within 24 hours
          </h3>
          <p className="font-body font-normal text-15 leading-[normal] text-pw-ink max-lg:text-[15px]">
            Your message has been sent to the Pizza Way team.
          </p>
          <button type="button" className={BUTTON} onClick={reset}>
            Send another message
          </button>
        </div>
      ) : (
        <form
          ref={formRef}
          className="m-0 flex w-full flex-col items-start gap-24 max-lg:gap-[20px]"
          aria-labelledby="contact-form-title"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="flex w-full flex-col gap-16 max-lg:gap-[16px]">
            <div className="flex w-full items-start gap-16 max-lg:gap-[16px] max-sm:flex-col">
              <div className={FIELD}>
                <label htmlFor="contact-name" className={LABEL}>
                  Full Name
                </label>
                <input {...a11y("name")} type="text" autoComplete="name" placeholder="Enter full name" className={CONTROL} />
                {err("name")}
              </div>
              <div className={FIELD}>
                <label htmlFor="contact-email" className={LABEL}>
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

            <div className="flex w-full items-start gap-16 max-lg:gap-[16px] max-sm:flex-col">
              <div className={FIELD}>
                <label htmlFor="contact-phone" className={LABEL}>
                  Phone Number
                </label>
                <input
                  {...a11y("phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="e.g. 07123 456789"
                  className={CONTROL}
                />
                {err("phone")}
              </div>
              <div className={FIELD}>
                <label htmlFor="contact-subject" className={LABEL}>
                  Subject Inquiry
                </label>
                <div className="relative w-full">
                  <select {...a11y("subject")} autoComplete="off" className={`${CONTROL} appearance-none cursor-pointer pr-44 max-lg:pr-[44px]`}>
                    <option value="" disabled>
                      Select standard option
                    </option>
                    {CONTACT_SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
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
                {err("subject")}
              </div>
            </div>

            <div className="flex w-full flex-col gap-8">
              <label htmlFor="contact-message" className={LABEL}>
                Your Message
              </label>
              <textarea
                {...a11y("message")}
                maxLength={1000}
                autoComplete="off"
                placeholder="Type details about your inquiry..."
                className={`${CONTROL} h-150 resize-y max-lg:h-[150px]`}
              />
              {err("message")}
            </div>
          </div>

          <button type="submit" className={BUTTON} disabled={submitting} aria-busy={submitting || undefined}>
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}
    </div>
  );
}
