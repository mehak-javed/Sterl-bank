# Sterl design system

> Black and gold, refined. Own brand only: never another bank's names, logos or colours.

## Principles

1. **One gold hero per page.** Gold marks the single most important thing (the total balance on the
   dashboard). Everything else sits on calm charcoal surfaces. If everything is gold, nothing stands out.
2. **Tokens, never hex.** Components use role tokens (`bg-surface-2`, `text-heading`, `chip`...).
   Each theme (dark, light, high contrast) maps roles to colours in `src/app/globals.css`.
3. **Accessibility beats branding.** High contrast switches the brand off (black and white). Every
   pair is checked against WCAG AA. Never rely on colour alone (money in gets a "+").
4. **Money reads like money.** `<Money>`: pounds large, pence smaller, `tabular-nums` so amounts line up.
5. **Phones first.** One column on phones, a 12-column grid from `lg`. A bottom tab bar on phones,
   a sidebar on desktop. Nothing may make the page wider than the screen (use `grid-cols-1`,
   `min-w-0`, and `w-full` on form fields).
6. **Motion is gentle and optional.** `rise-in` only when the device hasn't asked for reduced motion.

## Logo

`components/brand/Logo.tsx`: the full "STERL BANKING" lockup (ornament rules with diamond ends and
star medallions, STERL with a swoosh, BANKING letter-spaced), redrawn as SVG from Mehak's design.
Colours come from `--logo-1` / `--logo-2`:

| Theme | Logo gold | Contrast on the background |
| --- | --- | --- |
| Dark | `#f7dd8b` → `#c9a13b` | 7.4–14.7 : 1 |
| Light | `#8a6a1f` → `#5c4612` (bright gold is only ~2 : 1 on ivory) | 4.7–8.4 : 1 |
| High contrast | Plain white or black | 21 : 1 |

**The eagle** (`public/brand/eagle.png`, supplied by Mehak; `components/brand/Eagle.tsx`) crowns the
full logo, sits left of STERL in the compact `BrandMark`, and fills the empty right side of every
`PaymentCard`. The PNG is only a **stencil** (CSS `mask` / SVG alpha mask): the colour comes from the
theme (`--logo-1/2`, or `--card-accent` on cards via `eagle-on-card`), so one file works in dark, light
and high contrast. On cards it is `h-[18cqw]` (18% of that card's width, a container query) so it fits
the small dashboard card and the large Cards page card alike. Before publishing, the artwork's licence
must allow use in a public repository and as a logo.

Rules: the swoosh sits **behind** the letters and is fainter, so the name is always readable;
`role="img" aria-label="Sterl Banking"`; gradients use `gradientUnits="userSpaceOnUse"` (with the
default, the straight ornament lines have a 0-height box and paint nothing). The compact header and
sidebar version is `shell/BrandMark` (STERL in Cinzel + small BANKING). Font: Cinzel (`--font-display`).

## Public site

`src/app/(public)/`: `/` (home), `/security`, `/help`, `/login` (placeholder until Auth A2). The
banking app moved to `/dashboard`. Layout and mood follow the design reference Mehak supplied (a
frosted-glass hero over floating metallic objects, a two-tone headline that wipes in, a row of feature
circles, a pill button plus a round play button, a thumbnail rail switching the preview), in Sterl's
own colours, words and pictures. Pieces: `public/PublicHeader`, `PublicFooter`, `FloatingOrbs`,
`HeroShowcase` (Card / App / Round-ups / Markets previews from fake data).

**Full width:** pages use the whole screen (no `max-w-6xl` cap), with side padding
`px-4 sm:px-8 lg:px-12`. Long text keeps its own limit (`max-w-md`/`max-w-2xl`, the Help page's
two columns), because lines of more than about 75 characters are hard to read.

**Mirror glass:** `glass` and `panel` are see-through (dark 34%, light 42% tint) with a diagonal
reflection (`--sheen`) on top, so the gold spheres and glows show through. Rule: **no sphere behind
text**. Measured: a sphere behind "See how it works" dropped it to 3.5 : 1; moved behind the card
picture, it is 10 : 1. Devices that ask for less transparency, and high contrast, get solid panels.

**Demo notice:** required on every page, at the foot (public footer, app shell); no top banner since Nov 10. Previously:
(light gold 11.3 : 1 in dark mode, deep gold 8.4 : 1 in light; solid black/white in high contrast).

**Blur budget:** `glass` (real `backdrop-filter` blur) only where something sits behind to blur: the
header and the hero. Everything else uses `panel` (same look, no blur). A page with 13 blurred panels
failed to paint some of them.

## Cards

Four products in `src/lib/cards.ts` (`CARD_PRODUCTS`); the **product decides the design and network**,
so data can't hold an impossible combination. The public "Our cards" section and the banking wallet
both read this one catalogue.

| Product | Design | Network | Text contrast (worst point) |
| --- | --- | --- | --- |
| Everyday Debit | `card-design-black` | Visa | 15.4 : 1 |
| Premier Metal | `card-design-gold` | Mastercard | 5.7 : 1 (dark text) |
| Travel Card | `card-design-black-gold` (gold band behind chip and eagle only) | Mastercard | 17.4 : 1 |
| Virtual Card | `card-design-jolly` | Visa | 8.8 : 1 (dark text) |

Networks are plain words ("VISA", "Mastercard"); no network logo is copied. Last 4 digits come from
published test numbers only. Card designs keep their colours in every theme (they are pictures of
objects). Tailwind only builds classes it sees written in full, so `PaymentCard` maps designs to full
class names (`DESIGN_CLASS`), never `card-design-${design}`.

**Wallet** (`CardPanel`): a side-by-side slideshow on CSS scroll-snap (`snap-x snap-mandatory`):
the browser does swiping, momentum and snapping on touch, trackpad, wheel and keyboard. The centred
card is the chosen one (neighbours `scale-90 opacity-60`) and Freeze acts on it. No dots (Mehak's
choice): it is swiped by hand: finger, trackpad, or mouse click-and-drag (snapping is switched off
during a mouse drag, then the nearest card is centred on release). No arrows either (Mehak's
choice, made knowing WCAG 2.5.7 asks for a one-click alternative to swiping); the peeking edges of
the neighbouring cards show there are more. Keyboard: focus the strip, then ← →; while that smooth
scroll runs, the destination is remembered (`targetRef`) so a second quick press counts from it.
`aria-roledescription` "carousel"/"slide", slides labelled "2 of 4: Premier Metal ending 8210". Smooth scrolling is skipped for
reduced motion. Everything inside `PaymentCard` is sized in `cqw` (1% of the card's own width), so
a card looks the same at 260px on a phone and 384px on desktop; the card's OWN radius stays fixed,
because `cqw` on an element measures the container above it, not itself.

**Landing page look (Nov 11, Mehak's direction, inspired by a Dribbble fintech concept she
shared; Sterl's own name, brand, words and pictures; not a copy):** the public pages (`.public-site`
wrapper) get a deeper near-black page (`--public-bg` #030405, via `body:has(.public-site)` so the
banking app keeps its own background) and matte-silver secondary text (`--public-silver` #b8bcc2,
10.8 : 1). Gold stays the accent (Mehak chose black and gold over the reference's sage green).
Hero: message left (gold "New" badge, two-tone headline, value line, "Try the demo" + "See how it
works"), cards right; two frosted-glass chips with fake data float by the cards (`chip-float`,
`z-10` so the cards never cover them); a row of four glass feature cards under the hero. Spheres
only on the card side, and the side sphere only from `lg` (on phones the columns stack and it landed
behind the paragraph).

**Hero card pouch** (`public/CardPouch`, Mehak's idea from a reference video): a black-and-gold metal
pouch (brushed black, gold rim, gold strap, the eagle and STERL) holding all four cards, fanned
(`fan` angle + `shift` per card in `POUCH`). One at a time each card slides out, holds, and slides
back in, so the animation shows every card the bank offers (`--pouch-cycle` 16s, each card's turn a
quarter of it, set by negative `--delay`s). The "inside the pouch" effect is just paint order inside
one tilted scene: back panel, then cards, then front panel; a card below the front panel's top edge
is hidden behind it. The whole scene floats and turns gently (`pouch-float`), with a floor shadow.
Pure CSS; every value is a commented variable in globals.css. Still (the four cards fanned) for
reduced motion. `role="img"` with one sentence for screen readers.

**Tab icon:** `src/app/icon.png` (512) and `apple-icon.png` (180): the gold eagle on a near-black
rounded square, so it shows on light and dark tab bars. Drawn from `public/brand/eagle.png`.

## Tokens (added in the redesign)

| Token | Use |
| --- | --- |
| `surface-2` | A second surface level: rows inside a panel, inputs, secondary buttons |
| `chip`, `chip-foreground` | The background and colour of icon chips |
| `card-fill`, `card-foreground`, `card-accent` | The payment card graphic |

## Utilities

| Class | What it is |
| --- | --- |
| `glass` | See-through mirror glass: light blur, thin tint, diagonal reflection, bright top edge. Use sparingly (header, hero) |
| `panel` | The same see-through look and reflection without blur: the default for cards on long pages |
| `eagle-mark` / `eagle-on-card` | The eagle stencil in the logo gold / the card gold |
| `text-gold-gradient` | Metallic gold text for a headline's second line (deep gold in light mode, plain in high contrast) |
| `orb` | A CSS gold sphere for decoration (hidden in high contrast) |
| `float-slow` / `float-slower` / `wipe-in` / `wipe-in-late` | Floating and headline-reveal animations (skipped for reduced motion) |
| `hero-gold` | The one gold block per page; also changes the focus ring to stay visible on gold |
| `btn-primary` / `btn-secondary` | Main and secondary actions |
| `chip` | A rounded square holding an icon; size it with `h-` and `w-` |
| `eyebrow` | The small uppercase label above a heading or figure |
| `payment-card` | The card graphic's finish |
| `rise-in` | A short entrance animation (skipped for reduced motion) |

Shapes: panels `rounded-3xl p-5`, rows and inputs `rounded-2xl`/`rounded-xl`, pills `rounded-full`.

## Components

| Component | Where | Notes |
| --- | --- | --- |
| `shell/AppShell` | Every banking page | Sidebar (desktop), top bar and bottom tab bar (phones), skip link, the one `<main>` |
| `shell/Sheet` | Display settings, phone "More" | Native `<dialog>` + `showModal()`: focus is trapped, Esc closes, focus returns |
| `SiteNav` | Shell | `variant="sidebar" | "tabbar"`; `aria-current="page"` drives the active style |
| `ui/Money` | Anywhere money is shown | `showPlus` for money in |
| `ui/CategoryIcon` | Activity, spending | Decorative; the category name is always shown as text |
| `ui/PaymentCard` | Card panel | Last 4 digits only; details are real text for screen readers |
| `DisplaySettings` | Inside sheets | Real radios and checkboxes styled as pills and switches; `useId` for the radio group name |

Icons: `lucide-react` (pinned to 1.61.0), `strokeWidth` 1.75, always `aria-hidden` next to a text label.
