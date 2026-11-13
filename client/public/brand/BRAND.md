# Pizza Way: Brand Guidelines

Source: Figma `aMTASPIeSAbXKRu3f12Cgi`, section `pizzaway-v2-homepage` (node 188:6113). Extracted from the real designs (no separate guidelines page exists in the file).

## Tailwind (v4) usage
- Theme lives in `src/app/globals.css` (`@theme`). `--spacing` = fluid unit `--u` (1 design px at 1440 wide), so `w-680`, `p-80`, `gap-48`, `leading-90` equal Figma px and scale with the screen.
- Font sizes `text-110`, `text-14`; radii `rounded-24`, `rounded-pill`; fonts `font-heading` (Outfit), `font-body` (DM Sans).
- Colors: `bg-pw-green-700`, `text-pw-ink`, `bg-pw-red-600`, `bg-pw-surface`, `border-pw-line`, `bg-pw-footer` (see table below).
- Breakpoints: `max-lg:` = tablet and below (<=1023px), `max-sm:` = phones (<=640px).

## Colors
| Token | Hex | Use |
|---|---|---|
| `pw-green-950` | `#033513` | Nav header bg |
| `pw-green-900` | `#024d1a` | Cards on green sections, hero gradient edge |
| `pw-green-700` | `#03872d` | Primary green: sections, buttons, eyebrow text |
| `pw-green-600` | `#036a24` | Hero gradient middle |
| `pw-green-500` | `#20c955` | Accent: prices on green, basket badge |
| `pw-green-100` | `#e8f5e9` | Light green: icon circles, body text on dark green |
| `pw-red-600` | `#e50e01` | Main CTA, deal prices, Deals section bg |
| `pw-ink` | `#131c13` | Main text on light |
| `pw-muted` | `#606860` | Secondary text |
| `pw-surface` | `#f8faf8` | Card bg |
| `pw-border` | `#e2e6e2` | Card border (1.5px) |
| `pw-footer` | `#202020` | Footer bg |
| `pw-white` | `#ffffff` | Text on green/red, light sections |

Hero gradient: radial, `#03872d` center, `#036a24` mid, `#024d1a` edge.

## Fonts
| Role | Font | Weights |
|---|---|---|
| Headings, buttons, nav | **Outfit** | SemiBold 600 (nav), ExtraBold 800 (buttons, labels), Black 900 (headlines) |
| Body text | **DM Sans** | Regular 400 |

## Type scale
| Use | Font | Size |
|---|---|---|
| Hero headline | Outfit Black | 110px / line 90px |
| Section title | Outfit Black | 56px (44px on Quick Order) |
| Eyebrow | Outfit ExtraBold, uppercase | 14-16px |
| Card title | Outfit ExtraBold | 18-28px |
| Price | Outfit Black | 22-28px |
| Button | Outfit ExtraBold, uppercase | 13-16px |
| Nav link | Outfit SemiBold | 15px |
| Body | DM Sans | 13-20px (line 22-32px) |

## Shape and layout
| Item | Value |
|---|---|
| Buttons | Pill, radius 100px. Padding 10x20 (small), 14x28, 18x36 (hero) |
| Outline button | 1.5px white border, transparent |
| Cards | Radius 16 / 24 / 28 / 32px |
| Page | 1440 wide, content 1280, side padding 80px |
| Section padding | 96-120px vertical |

## Logo
- Inline SVG component: `src/components/logo.tsx` (`<Logo />`, native 194x40.5).
- Files: `logo/pizzaway-logo-light.svg` (nav), `logo/pizzaway-logo-footer.svg` (footer).
- Colors inside: `#E50E01`, `#03872D`, `#20C955`, `#131C13`, white. Made for dark backgrounds.

## Assets (`public/brand/`)
| Folder | Content |
|---|---|
| `logo/` | 2 logo SVGs |
| `icons/` | Shopping bag, category icons (pizza, circle-x, cup-soda, badge-percent, package), pillars, location, star, footer line |
| `images/` | Hero slice, 4 featured pizzas, 4 deal cards, build-your-pizza (2), family-feast (2) |

## Not yet collected
- Images from other pages (menu, about, team, etc.).
