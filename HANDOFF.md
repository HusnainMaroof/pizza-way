# Pizza Way: Handoff

Where the project stands, how it works, and what to watch out for. Written 2026-11-14.

## 1. Quick facts

| Item | Value |
|---|---|
| Repo | `https://github.com/HusnainMaroof/pizza-way` (branch `main`) |
| Local folder | `C:/Users/husna/Desktop/pizza_way` |
| Client | `client/`: Next.js 16 (App Router, `src/`), TypeScript, Tailwind CSS v4 |
| Server | `server/`: empty, no backend yet |
| Design source | Figma file key `aMTASPIeSAbXKRu3f12Cgi` (file "Pizza Way") |
| Dev server | `npm run dev` in `client/` -> `http://localhost:3000` |
| Last check | All 17 routes return 200, unknown paths return 404 (checked on localhost) |

## 2. Run it

| Task | Command (in `client/`) |
|---|---|
| Dev server | `npm run dev` |
| Type check | `npm run typecheck` |
| Production build | `npm run build` then `npm run start` |

- Do NOT run `npm run build` while `npm run dev` is running. It breaks the dev server's files. Stop the dev server, delete `client/.next`, restart.
- The Browser preview pane freezes animations when it is hidden. Show the pane before testing motion.

## 3. Pages (all built from Figma)

| Route | Figma frame | Notes |
|---|---|---|
| `/` | 97:4 | Home. Pinned scroll stories (see section 6) |
| `/menu` | 97:541 | Filter chips, 8 pizzas, sides. Sticky filter bar |
| `/menu/[id]` | 97:1217 | Product detail for each of the 8 pizzas (e.g. `/menu/margherita`) |
| `/deals` | 97:828 | |
| `/build-your-pizza` | 97:968 | Interactive configurator |
| `/locations` | 97:2232 | Search filters stores via `?q=` and `?mode=` |
| `/about` | 97:2408 | |
| `/contact` | 97:2549 | Validated form, FAQ accordion |
| `/careers` | 184:4 | |
| `/careers/open-roles` | 186:4 | Filterable role list |
| `/cart` | 97:1453 | Real saved basket |
| `/checkout` | 97:1638 | Validated form, places an order |
| `/order-confirmation` | 97:1900 | Shows the last placed order |
| `/order-tracking` | 97:2056 | Live, simulated by time since the order |
| `/login`, `/account` | 97:2721 | Placeholder sign-in, account tabs |
| `/privacy-policy` | 184:228 | Sticky index with scroll tracking |

## 4. Where things live

| What | Where |
|---|---|
| Theme, tokens, scrollbar | `client/src/app/globals.css` (Tailwind `@theme`) |
| Page components | `client/src/components/<page>/` (one folder per page) |
| Shared logo (inline SVG) | `client/src/components/logo.tsx` |
| Brand guide | `client/public/brand/BRAND.md` |
| Images and icons | `client/public/brand/<page>/` |
| State (Zustand) | `client/src/store/` |
| Validation (Zod) | `client/src/schemas/` |
| Data and logic | `client/src/lib/` (`pricing.ts`, `tracking.ts`, `byo-data.ts`, `gsap.ts`) |
| Motion helpers | `client/src/components/motion/` (`tokens.ts`, `reveal.tsx`, `motion-provider.tsx`) |
| Pizza data (server-safe) | `client/src/components/menu/pizza-data.ts` |

## 5. Design system (Tailwind v4)

- `--spacing` equals the fluid unit `--u` (1 Figma px at 1440 wide). So `w-680`, `p-80`, `gap-48` equal Figma pixels and scale with the screen.
- Text sizes `text-14`, `text-110`..., radii `rounded-24`, `rounded-pill`, colors `bg-pw-green-700`, `text-pw-ink`, `bg-pw-red-600`, fonts `font-heading` (Outfit), `font-body` (DM Sans).
- Breakpoints: `max-lg:` is tablet and below (<=1023px), `max-sm:` is phones (<=640px). Desktop scales between 0.6x and 1.5x.
- Use `leading-[normal]`, never `leading-normal` (that is 1.5 in Tailwind).
- Only Tailwind classes in `className`. No CSS modules, no custom classes. The only plain CSS is in `globals.css`.
- Loaded font weights: Outfit 600/700/800/900, DM Sans 400/500/700 plus italic. Other weights get faked by the browser.

## 6. Motion (home and menu only)

| Piece | How it works |
|---|---|
| Libraries | `framer-motion` 14.6.0 (reveals, hover, layout) and `gsap` + ScrollTrigger (pinned, scrubbed effects) |
| Reduced motion | Framer: `MotionConfig reducedMotion="user"`. GSAP: runs only inside `gsap.matchMedia()` with `MOTION_OK` |
| Allowed properties | transform, opacity, clip-path only. Never width/height/top/left |
| Pinned stories (desktop >= 1024 only) | `featured-pizzas.tsx` (wipe over Quick Order, cards orbit in) and `formula-system-story.tsx` (wipe over Family Feast, Core Formula, then System wipe) |
| Stage rule | Each stage is exactly one screen tall (`h-svh`) with the previous section as its bottom layer. Content scales down to fit short screens (`FIT_MARGIN` = 120) |
| Active card rule | Core Formula and System: one card is active (scale 1.3, full opacity), the other two are idle (scale 0.58, opacity 0.45) |
| Phones and tablets | No pin and no wipe, plain stacked layout with a simple reveal |
| Header | `NavHeader sticky` on home and menu: hides on scroll down, returns on scroll up. Publishes `data-header-hidden` on `<html>` so the menu filter bar slides with it |
| Carousel | `testimonials.tsx`: 3/2/1 cards per view, autoplay 5s (pauses on hover/focus/hidden tab), drag, arrows, dots, keyboard |

If you change a pinned section: re-measure at 1920x1080, 1366x768, 1440x700 and 1024x700, and check phones (375) have no pin.

## 7. State and data flow

| Store (in `src/store/`) | Persisted | Purpose |
|---|---|---|
| `cart-store.ts` | localStorage `pizzaway-cart` | Basket items. Nav badge reads the count |
| `order-store.ts` | localStorage `pizzaway-order` | `lastOrder` and `history` (max 20). Card data is never stored, only brand and last 4 digits |
| `auth-store.ts` | localStorage `pizzaway-auth` | Placeholder profile (name, email). No password stored |
| `byo-store.ts` | no | Build-your-pizza selections and price |
| `checkout-store.ts` | no | `submitting` flag shared between the form and the Place Order button |
| `usePromoStore`, `useFulfilmentStore` in `lib/pricing.ts` | no | Applied promo code, delivery or collection |

- Persisted stores use `skipHydration`. `src/components/cart-hydrator.tsx` (mounted in `layout.tsx`) rehydrates them after mount. On first render they look empty, so use the hydration hooks (`useCartHydrated`, `useOrderHydrated`, `useAuthHydrated`).
- Basket flow: menu / product / build page -> cart store -> `/cart` -> `/checkout` -> `order-store.place()` (clears basket and promo) -> `/order-confirmation` -> `/order-tracking`.

## 8. What is fake or a placeholder

| Area | Reality |
|---|---|
| Payments | Nothing is charged. Checkout waits 0.9s, then saves the order locally |
| Sign-in | Any valid email and an 8+ character password signs in. Name comes from the email. Google button and "forgot password" do nothing real |
| Order tracking | Time-based simulation (stages at 0, 7, 17, 32 minutes after placing). No courier system |
| Contact form | Validates, then shows a success message. Nothing is sent |
| Promo code | Only `PIZZA10` (10% off). Not in Figma. Edit in `lib/pricing.ts` |
| Delivery fee | £2.99 flat (from the design) |
| Stores and roles | Hard-coded lists (`locations/stores-data.ts`, `careers/roles-data.ts`) |
| Testimonials | 3 from Figma plus 3 invented ones (Priya Nair, Tom Hargreaves, Sophie Clarke). Replace with real reviews |
| Careers jobs | Only the first job has real description text in Figma. Others are written placeholders |
| FAQ answers | Contact page: only the first answer is from Figma, the other four are written placeholders |
| Contact details | "0800 PIZZA WAY" is plain text, email `hello@pizzawayuk.com` |
| Menu pizza tags | Chip filters (Classic, Meat, Chicken...) use tags the agent invented, not from Figma |
| Topping prices | Build-your-pizza uses a flat £0.60 per topping |
| Map | Drawn with divs, not a real map |

## 9. Conventions and gotchas

- Figma pages that had no mobile design: phone and tablet layouts are my own, in the same style.
- The Figma locations frame has two footers. Only the "STILL HUNGRY?" CTA plus the standard footer were built.
- `motion` (npm) was not used: its newest version points to an unpublished Framer version. Use `framer-motion@14.6.0`.
- Server components can use animation via `import * as motion from "framer-motion/client"` (serialisable props only).
- Hero and reveal elements start hidden (opacity 0) until JavaScript loads. If scripts fail, those parts stay hidden.
- `pizza-data.ts` must stay free of `"use client"` so the product route can build static pages.
- Hero pizza image is only 360px in Figma's source, so it is slightly soft at large sizes.
- ESLint is not configured (no `eslint.config`). Only `tsc` runs.

## 10. Suggested next steps

| Priority | Task |
|---|---|
| 1 | Build the backend in `server/` (menu, orders, auth) and replace the placeholders in section 8 |
| 2 | Real payments (e.g. Stripe test mode first) and real accounts |
| 3 | Replace the invented copy and reviews with real content |
| 4 | Add tests and ESLint, then CI (typecheck and build) |
| 5 | Optimise the large menu photos (about 2MB each) before launch |

## 11. Git state

| Commit | What |
|---|---|
| `30bffd7` | First commit (README) |
| `a463445` | Whole client site, Tailwind theme, responsive layouts |
| `0369f4d` | Home and menu animations (Framer Motion + GSAP), custom scrollbar |
