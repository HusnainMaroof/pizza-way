"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode, type Ref } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { emailSchema, signInSchema, signUpSchema } from "@/schemas/auth";
import { nameFromEmail, useAuthStore } from "@/store/auth-store";
import { useAuthHydrated } from "@/lib/use-hydrated";

type Mode = "signin" | "signup" | "forgot";
type FieldName = "name" | "email" | "password";
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;

const EMPTY: Values = { name: "", email: "", password: "" };
const ORDER: FieldName[] = ["name", "email", "password"];
const REQUEST_MS = 700;

const SECTION =
  "flex w-full flex-col items-center p-96 bg-white border border-solid border-pw-line max-lg:px-[40px] max-lg:py-[64px] max-sm:px-[20px] max-sm:py-[40px]";
const CARD =
  "flex w-500 flex-col items-start gap-32 p-48 bg-pw-surface border-[1.5px] border-solid border-pw-line rounded-32 shadow-[0_calc(8*var(--u))_calc(12*var(--u))_rgba(0,0,0,0.05)] max-lg:w-full max-lg:max-w-[500px] max-lg:gap-[28px] max-lg:p-[40px] max-lg:rounded-[28px] max-lg:shadow-[0_8px_12px_rgba(0,0,0,0.05)] max-sm:p-[24px] max-sm:gap-[24px] max-sm:rounded-[24px]";
const HEADING =
  "w-full font-heading font-black text-28 leading-[normal] text-center text-pw-ink outline-none max-lg:text-[clamp(22px,6.5vw,28px)]";
const SUBTITLE = "font-body font-normal text-14 leading-[normal] text-center text-pw-muted max-lg:text-[14px]";
const FIELD = "flex w-full flex-col items-start gap-8 max-lg:gap-[8px]";
const LABEL = "font-body font-bold text-13 leading-[normal] text-pw-ink max-lg:text-[13px]";
const CONTROL =
  "block w-full min-w-0 m-0 p-16 bg-white border-[1.5px] border-solid border-pw-line rounded-12 font-body font-normal text-14 leading-[normal] text-pw-ink placeholder:text-pw-muted placeholder:opacity-100 outline-none transition-colors duration-150 hover:border-pw-muted focus-visible:border-pw-green-700 focus-visible:ring-2 focus-visible:ring-pw-green-700/25 aria-invalid:border-pw-red-600 max-lg:min-h-[48px] max-lg:p-[14px] max-lg:rounded-[12px] max-lg:text-[16px]";
const ERROR = "font-body font-medium text-13 leading-[normal] text-pw-red-600 max-lg:text-[13px]";
const LINK_BTN =
  "m-0 p-0 border-0 bg-transparent cursor-pointer font-body font-semibold text-13 leading-[normal] text-pw-green-700 underline-offset-2 hover:underline outline-none rounded-6 focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-2 max-lg:text-[14px] max-lg:min-h-[48px] max-lg:px-[4px]";
const PRIMARY =
  "flex w-full items-center justify-center px-32 py-16 border-0 rounded-pill bg-pw-red-600 cursor-pointer font-heading font-extrabold text-14 leading-[normal] uppercase whitespace-nowrap text-white transition-[filter] duration-150 hover:brightness-95 outline-none focus-visible:ring-2 focus-visible:ring-pw-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 max-lg:min-h-[52px] max-lg:px-[24px] max-lg:py-[16px] max-lg:text-[15px]";
const OUTLINE =
  "flex w-full items-center justify-center gap-10 p-14 bg-white border-[1.5px] border-solid border-pw-line rounded-pill cursor-pointer font-body font-semibold text-14 leading-[normal] text-pw-ink whitespace-nowrap no-underline transition-colors duration-150 hover:border-pw-muted outline-none focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-2 max-lg:min-h-[52px] max-lg:gap-[10px] max-lg:p-[14px] max-lg:text-[15px]";

const COPY: Record<Mode, { title: string; subtitle: string; submit: string; busy: string }> = {
  signin: {
    title: "WELCOME BACK.",
    subtitle: "Please authenticate your Pizzaway credentials.",
    submit: "Sign In",
    busy: "Signing In...",
  },
  signup: {
    title: "CREATE YOUR ACCOUNT.",
    subtitle: "Join Pizzaway for faster checkout and order tracking.",
    submit: "Sign Up",
    busy: "Creating Account...",
  },
  forgot: {
    title: "RESET PASSWORD.",
    subtitle: "Enter your email and we'll send you a reset link.",
    submit: "Send Reset Link",
    busy: "Sending...",
  },
};

/** Login / sign up / reset card (Figma 97:2743). PLACEHOLDER auth: no backend, password is never stored or logged. */
export function LoginSection({ redirectTo = "/account" }: { redirectTo?: string }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const uid = useId();

  const [mode, setMode] = useState<Mode>("signin");
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  // Cosmetic only: the placeholder auth store always persists on this device.
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeChanged = useRef(false);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (modeChanged.current) headingRef.current?.focus();
  }, [mode, resetSent]);

  const id = (name: string) => `${uid}-${name}`;

  function switchMode(next: Mode) {
    modeChanged.current = true;
    setMode(next);
    setErrors({});
    setValues((v) => ({ ...v, password: "" }));
    setShowPassword(false);
    setResetSent(false);
    setGoogleNotice(false);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const name = e.target.name as FieldName;
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  }

  function fail(next: Errors) {
    setErrors(next);
    const first = ORDER.find((k) => next[k]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || redirecting) return;

    if (mode === "forgot") {
      const r = emailSchema.safeParse(values.email);
      if (!r.success) return fail({ email: r.error.issues[0]?.message });
      setErrors({});
      setSubmitting(true);
      timer.current = setTimeout(() => {
        setSubmitting(false);
        modeChanged.current = true;
        setResetSent(true);
      }, REQUEST_MS);
      return;
    }

    const result =
      mode === "signup"
        ? signUpSchema.safeParse(values)
        : signInSchema.safeParse({ email: values.email, password: values.password, remember });
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as FieldName;
        if (!next[key]) next[key] = issue.message;
      }
      return fail(next);
    }

    const email = result.data.email;
    const name = "name" in result.data ? result.data.name : nameFromEmail(email);
    setErrors({});
    setSubmitting(true);
    timer.current = setTimeout(() => {
      setRedirecting(true);
      useAuthStore.getState().signIn({ name, email });
      setValues(EMPTY);
      router.push(redirectTo);
    }, REQUEST_MS);
  }

  function a11y(name: FieldName) {
    return {
      id: id(name),
      name,
      value: values[name],
      onChange,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? id(`${name}-error`) : undefined,
    } as const;
  }

  function err(name: FieldName) {
    return errors[name] ? (
      <p id={id(`${name}-error`)} role="alert" className={ERROR}>
        {errors[name]}
      </p>
    ) : null;
  }

  // Already signed in (only known after hydration; before it, render the normal card).
  if (hydrated && user && !redirecting) {
    return (
      <section className={SECTION} aria-labelledby={id("title")}>
        <div className={CARD}>
          <CardHeader
            title="YOU'RE SIGNED IN."
            titleId={id("title")}
            subtitle={
              <>
                You&apos;re signed in as <strong className="font-bold text-pw-ink">{user.name}</strong>{" "}
                <span className="break-all">({user.email})</span>
              </>
            }
          />
          <div className="flex w-full flex-col gap-16 max-lg:gap-[12px]">
            <Link href="/account" className={PRIMARY}>
              Go to my account
            </Link>
            <button type="button" className={OUTLINE} onClick={() => useAuthStore.getState().signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </section>
    );
  }

  const copy = COPY[mode];
  const busy = submitting || redirecting;

  return (
    <section className={SECTION} aria-labelledby={id("title")}>
      <div className={CARD}>
        <CardHeader title={copy.title} titleId={id("title")} subtitle={copy.subtitle} headingRef={headingRef} />

        {mode === "forgot" && resetSent ? (
          <div className="flex w-full flex-col items-center gap-24 max-lg:gap-[20px]">
            <p
              role="status"
              className="w-full p-16 bg-pw-green-100 border-[1.5px] border-solid border-pw-green-700 rounded-12 font-body font-medium text-14 leading-[normal] text-center text-pw-green-900 max-lg:p-[16px] max-lg:rounded-[12px] max-lg:text-[15px]"
            >
              If an account exists for that email, a reset link is on its way.
            </p>
            <button type="button" className={LINK_BTN} onClick={() => switchMode("signin")}>
              Back to sign in
            </button>
          </div>
        ) : (
          <form
            ref={formRef}
            noValidate
            onSubmit={onSubmit}
            aria-labelledby={id("title")}
            className="m-0 flex w-full flex-col items-start gap-32 max-lg:gap-[24px]"
          >
            <div className="flex w-full flex-col items-start gap-16 max-lg:gap-[16px]">
              {mode === "signup" && (
                <div className={FIELD}>
                  <label htmlFor={id("name")} className={LABEL}>
                    Full Name
                  </label>
                  <input {...a11y("name")} type="text" autoComplete="name" placeholder="Enter full name" className={CONTROL} />
                  {err("name")}
                </div>
              )}

              <div className={FIELD}>
                <label htmlFor={id("email")} className={LABEL}>
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

              {mode !== "forgot" && (
                <div className={FIELD}>
                  <label htmlFor={id("password")} className={LABEL}>
                    Password
                  </label>
                  <div className="relative w-full">
                    <input
                      {...a11y("password")}
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"}
                      className={`${CONTROL} pr-52 max-lg:pr-[52px]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      aria-controls={id("password")}
                      className="absolute top-1/2 right-6 flex size-40 -translate-y-1/2 items-center justify-center m-0 p-0 border-0 bg-transparent rounded-pill cursor-pointer outline-none hover:bg-pw-surface focus-visible:ring-2 focus-visible:ring-pw-green-700 max-lg:right-[2px] max-lg:size-[46px]"
                    >
                      <Image
                        src={showPassword ? "/brand/auth/eye-off.svg" : "/brand/auth/eye.svg"}
                        alt=""
                        width={20}
                        height={20}
                        className="block size-20 max-lg:size-[20px]"
                      />
                    </button>
                  </div>
                  {err("password")}
                </div>
              )}
            </div>

            {mode === "signin" && (
              <div className="flex w-full items-center justify-between gap-12 max-lg:gap-[12px]">
                <label className="flex cursor-pointer items-center gap-8 font-body font-normal text-13 leading-[normal] text-pw-ink max-lg:min-h-[48px] max-lg:gap-[10px] max-lg:text-[14px]">
                  <span className="relative flex size-18 shrink-0 items-center justify-center max-lg:size-[20px]">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="peer m-0 size-full appearance-none cursor-pointer bg-white border-[1.5px] border-solid border-pw-line rounded-[calc(4*var(--u))] checked:bg-pw-green-700 checked:border-pw-green-700 outline-none focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-2 max-lg:rounded-[4px]"
                    />
                    <Image
                      src="/brand/auth/check.svg"
                      alt=""
                      width={10}
                      height={10}
                      className="pointer-events-none absolute hidden size-10 peer-checked:block max-lg:size-[11px]"
                    />
                  </span>
                  Remember me
                </label>
                <button type="button" className={LINK_BTN} onClick={() => switchMode("forgot")}>
                  Forgot password?
                </button>
              </div>
            )}

            <div className="flex w-full flex-col items-start gap-16 max-lg:gap-[16px]">
              <button type="submit" className={PRIMARY} disabled={busy} aria-busy={busy || undefined}>
                {busy ? copy.busy : copy.submit}
              </button>

              {mode !== "forgot" && (
                <>
                  <div className="flex w-full items-center gap-16 max-lg:gap-[16px]" aria-hidden="true">
                    <Image src="/brand/auth/line.svg" alt="" width={180} height={1} className="block h-px min-w-0 flex-1" />
                    <span className="font-body font-normal text-12 leading-[normal] text-pw-muted max-lg:text-[13px]">or</span>
                    <Image src="/brand/auth/line.svg" alt="" width={180} height={1} className="block h-px min-w-0 flex-1" />
                  </div>
                  <button
                    type="button"
                    className={OUTLINE}
                    aria-describedby={googleNotice ? id("google-notice") : undefined}
                    onClick={() => setGoogleNotice(true)}
                  >
                    <Image src="/brand/auth/circle-x.svg" alt="" width={16} height={16} className="block size-16 max-lg:size-[16px]" />
                    Continue with Google
                  </button>
                  <p
                    id={id("google-notice")}
                    role="status"
                    className="w-full font-body font-medium text-13 leading-[normal] text-center text-pw-muted empty:hidden max-lg:text-[13px]"
                  >
                    {googleNotice ? "Google sign-in isn't available yet. Use your email instead." : ""}
                  </p>
                </>
              )}
            </div>
          </form>
        )}

        <div className="flex w-full flex-wrap items-center justify-center gap-4 font-body text-13 leading-[normal] max-lg:gap-x-[4px] max-lg:text-[14px]">
          {mode === "signin" ? (
            <>
              <span className="font-normal text-pw-muted">Don&apos;t have an account?</span>
              <button type="button" className={LINK_BTN} onClick={() => switchMode("signup")}>
                Sign up
              </button>
            </>
          ) : mode === "signup" ? (
            <>
              <span className="font-normal text-pw-muted">Already have an account?</span>
              <button type="button" className={LINK_BTN} onClick={() => switchMode("signin")}>
                Sign in
              </button>
            </>
          ) : resetSent ? null : (
            <>
              <span className="font-normal text-pw-muted">Remembered it?</span>
              <button type="button" className={LINK_BTN} onClick={() => switchMode("signin")}>
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function CardHeader({
  title,
  titleId,
  subtitle,
  headingRef,
}: {
  title: string;
  titleId: string;
  subtitle: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-12 max-lg:gap-[12px]">
      <div className="flex items-center gap-8 max-lg:gap-[8px]" aria-hidden="true">
        <span className="flex items-start p-6 bg-pw-green-700 rounded-[calc(8*var(--u))] font-heading font-black text-18 leading-[normal] text-white max-lg:p-[6px] max-lg:rounded-[8px] max-lg:text-[18px]">
          P
        </span>
        <span className="flex flex-col items-start leading-[normal] whitespace-nowrap">
          <span className="font-heading font-black text-22 text-pw-ink max-lg:text-[22px]">PIZZAWAY</span>
          <span className="font-heading font-extrabold text-[length:calc(8*var(--u))] uppercase text-pw-green-500 max-lg:text-[8px]">
            UK LTD
          </span>
        </span>
      </div>
      <h1 id={titleId} ref={headingRef} tabIndex={-1} className={HEADING}>
        {title}
      </h1>
      <p className={SUBTITLE}>{subtitle}</p>
    </div>
  );
}
