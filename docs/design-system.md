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
works"), cards right; a row of four glass feature cards under the hero. Spheres
only on the card side, and the side sphere only from `lg` (on phones the columns stack and it landed
behind the paragraph).

**Hero card pouch** (`public/CardPouch`, Mehak's idea): a black-and-gold metal pouch (brushed black,
gold rim, gold strap, the eagle and STERL) holding all four cards, fanned (`fan` + `shift` per card in
`POUCH`), with a flap and gold clasp. One loop (`--pouch-cycle` 10s; 14s felt slow), one shared clock
for the cards and the flap: open → the cards fly up and off the screen, one after another (`--stagger` 0.15s apart)
→ the flap closes → it opens → the cards drop back in → the flap closes over them → it opens. The
"inside the pouch" effect is paint order inside one tilted scene: back panel, cards, front panel,
flap. The flap is hinged at its top edge: open = `rotateX(90deg)` (edge-on, invisible), closed =
`rotateX(0)`. It is wider than the front panel so the fanned cards' corners stay under it. Cards are 56% wide
with a ±8° / ±4% fan, so at rest every card stays inside the pouch (measured; at ±13° the gold
card's corner hung outside). Each move has its own easing (set inside the keyframes): cards speed
up as they fly out and land softly; the flap snaps shut with a small overshoot and opens quickly. The whole
scene floats gently. Pure CSS; the timeline is written out in globals.css. Still (open, cards fanned)
for reduced motion. No floating chips or boxes on the landing page (Mehak removed them).

**Send-money showcase** (`public/SendMoneyShowcase`, replaced the "Our cards" section and its menu
link; layout idea from a Dribbble shot Mehak shared, Sterl's own style): centred two-tone heading,
then a badge + headline + paragraph + gold button ("Try moving money" → `/dashboard#move-money`) on
the left, and a picture of the send-money screen on the right in a dark glass frame over a gold
horizon glow (`send-showcase`, `-horizon`, `-screen`). Below: Analytics, Budgeting and Accounts
cards, each with a mini preview (`send-showcase-mini`). The screen is a picture (`role="img"`, one
sentence; no real inputs or buttons inside), and every figure is the demo's fake data in pence.

**Landing page sections (Nov 11, Mehak's cut):** hero (no badge) → send money (no badge) → the team
→ "Meet our people" → how it works. Removed: the four boxes under the hero, Features, "Protected
like a real bank", "Ready to look around?". The menu's Features link became People (`/#people`).

**Meet our people** (`public/PeopleStories`, client): four stories, one at a time (photo, headline,
quote, name and role), previous / next with "1 / 4", every story as a tab with a gold top line on the
current one (`aria-current`), `aria-live` so changes are read out, no autoplay (WCAG 2.2.2). Photos:
four free Unsplash-License photos Mehak chose, loaded from Unsplash's CDN through `next/image`
(`images.unsplash.com` allowed in `next.config.ts` remotePatterns), each with alt text; no visible
credit (not required by the licence; Mehak removed the tags), photographers recorded in the code. A fifth photo she picked is Unsplash+ (paid licence) and was left out. Names,
jobs and quotes are fictional, and the page says the people shown are models, not Sterl staff
(Unsplash's licence asks that photos not imply endorsement). "Work that matters, every single day" and
its paragraph are now the hero headline (they replaced "Banking meets brilliance"); the "Sterl is
growing" statement and the separate team block were removed. `#people` is the Meet our people section. Header: Log in + Sign up (`/signup` is an honest placeholder until account
opening in Auth sprint B); "Try the demo" stays as the hero's main button.

**Footer and public pages (Nov 11):** the footer text is Mehak's headquarters line; the footer demo
notice was removed at her request (forms keep a "use made-up details" line). Footer links: Home,
Careers, Help, Recruitment scams, Security and confidentiality, Log in, Sign up.
- `/careers`: hero (no Apply now; "See open roles"), three focus areas, "Careers that grew here" (the four people
  stories), Fresh Starts returners programme, Why Sterl, open roles (each with Apply now), how we
  hire, a scam warning. Structure inspired by large banks' careers pages; Sterl's own words.
- `/careers/jobs/[role]` (static per role): summary, facts (team, location, job type, salary), what
  you'll do, what you'll need, nice to have, Apply now near the top and at the bottom.
- `/careers/apply/[role]` (static, one page per role in `lib/careers/roles.ts`; back link to the role):
  the application form (`components/careers/ApplicationForm`, React Hook Form + Zod): personal
  information, education, experience (0–5 roles, `useFieldArray`), CV upload (PDF/Word ≤ 5 MB),
  optional note, consent. One Zod schema (`lib/careers/application.ts`) runs in the browser and
  again in the server action (`server/careers-actions.ts`), which also checks the CV's first bytes
  (magic numbers) because a file's name and type are chosen by the sender. Delivery goes through a
  `CareersInbox` interface; the demo inbox logs only the reference and stores/sends nothing (no
  real inbox; CVs are personal data). Server actions accept 6 MB (`next.config.ts`). Errors use the
  `--danger` token (6.1–9.0 : 1 in every theme); an error summary and per-field messages are linked
  with `aria-describedby`.
- `/recruitment-scams` (replaced `/scams`): warning signs, what Sterl will never do, how to report,
  addresses only on the reserved `@sterl.example` domain.
- `/security`: "Security and confidentiality" (unbuilt items say "coming").

**No "demo" wording (Nov 11, Mehak's decision):** the site reads as a real, new bank; she explains
the portfolio context in the repository. `no-demo-copy.test.tsx` fails if "demo", "fake",
"made-up", "fictional" or "simulated" appears in any public page's visible text ("fake interviews"
on Recruitment scams is allowed: it describes scammers). The site is indexed (Mehak wants it on
Google): `sitemap.xml` lists the public pages and every apply page; `robots.txt` keeps personal banking
pages and `/api/` out. Safeguards: no truly private data in forms, no authorisation claims, Sterl's own
brand (not impersonating a real bank), `@sterl.example` addresses.
**Security policy** (`/security/policy`): how to report (security@sterl.example), scope, testing
rules, response times, safe harbour; machine-readable twin `/.well-known/security.txt` (RFC 9116).

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
