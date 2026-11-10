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

**Blur budget:** `glass` (real `backdrop-filter` blur) only where something sits behind to blur: the
header and the hero. Everything else uses `panel` (same look, no blur). A page with 13 blurred panels
failed to paint some of them.

## Tokens (added in the redesign)

| Token | Use |
| --- | --- |
| `surface-2` | A second surface level: rows inside a panel, inputs, secondary buttons |
| `chip`, `chip-foreground` | The background and colour of icon chips |
| `card-fill`, `card-foreground`, `card-accent` | The payment card graphic |

## Utilities

| Class | What it is |
| --- | --- |
| `glass` | A frosted panel with real blur (charcoal in dark mode, white in light), hairline gold-tinted border. Use sparingly |
| `panel` | The same look without blur: the default for cards on long pages and panels inside a glass card |
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
