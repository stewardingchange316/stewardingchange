# Handoff: Stewarding Change — Brand & Landing

A complete brand identity + marketing hero for **Stewarding Change**, a faith-based financial services product that turns everyday round-ups into mission giving.

---

## About the design files

The files in this bundle are **design references created in HTML** — high-fidelity prototypes showing the intended look, feel, and behavior. They are **not production code to copy directly.**

Your job is to **recreate these designs in the target codebase's existing environment** (React, Vue, SwiftUI, native iOS, etc.) using its established patterns, component libraries, and styling conventions. If no environment exists yet, pick the framework that best fits the product (React + Tailwind is a strong default for a fintech marketing site + web app).

## Fidelity

**High-fidelity (hi-fi).** Colors, typography, spacing, gradients, animations, and interactions are production-intent. Recreate pixel-perfectly using the codebase's design system — don't re-derive values.

---

## Files in this bundle

| File | Purpose |
|---|---|
| `Stewarding Change Hero.html` | **Marketing landing page** — full hero, feature sections, product mockups, footer. This is the primary artifact. |
| `Brand Sheet.html` | Brand identity reference — 3D coin hero, logo variations, app icon, palette, typography, brand meaning, phone mockup, brand applications. |
| `Logo Exploration.html` | Iteration of three lightning-bolt logo variants (V1 Classic, V2 Chiseled, V3 Ribbon) on navy / gradient / white. V1 is the chosen direction. |
| `brand/coin.jsx` | The 3D coin SVG component + flat logo variants (used in Brand Sheet). |
| `brand/phone.jsx` | iPhone mockup with round-ups dashboard (used in Brand Sheet). |
| `logo/marks.jsx` | All logo mark constructions + wordmark lockup (used in Logo Exploration). |
| `assets/sc-logo.png` | Rasterized logo asset. |

---

## Brand

### Name
**Stewarding Change** — two words, equal weight. The wordmark is typically set with "Stewarding" in white and "Change" in accent blue (`#4F8FF7`), stacked on two lines for hero treatments, or on one line for lockups.

### Tagline
> Your spare change, purposefully given.

### Brand meaning
- **The S / Lightning Bolt** — energy, momentum, the spark that creates change.
- **The Coin** — stewardship, completeness, resources entrusted to us.
- **The Point** — where small actions create extraordinary impact.

### Voice
Clean, corporate, universal (Stripe-like), not overtly religious. The faith angle is delivered through context (mission funds, community orgs) rather than symbols.

---

## Design tokens

### Colors (exact hex)

| Token | Hex | Use |
|---|---|---|
| `--bg-1` | `#060B1F` | Page base, near-black navy |
| `--bg-2` | `#0B1A46` | Deep navy surfaces |
| `--bg-3` | `#1B3FA6` | Mid-navy / hero gradient stop |
| `--navy1` | `#0B1F3A` | Card base (Brand Sheet) |
| `--navy2` | `#1E3A8A` | Card gradient top |
| `--blue` | `#2563EB` | Primary brand blue |
| `--bright` | `#4F8FF7` | "Change" wordmark, bolt fill mid |
| `--accent` / `--sky` | `#7DB7FF` / `#60A5FA` | Accent strokes, bolt highlights, active UI |
| `--ice` | `#E6F0FF` | Light surfaces, app icon gradient |
| `--white` | `#FFFFFF` | Text, wordmark primary |
| `--ink` | `#F6F8FC` | Body text on navy |
| `--ink-dim` | `rgba(246,248,252,0.72)` | Secondary text |
| `--ink-mute` | `rgba(246,248,252,0.54)` | Tertiary text / labels |
| `--card` | `rgba(255,255,255,0.06)` | Translucent card fill |
| `--card-stroke` | `rgba(255,255,255,0.12)` | Card border |
| `--border` | `rgba(96,165,250,0.14)` | Cool-toned border (Brand Sheet) |

**Primary gradient (hero/coin):**
`linear-gradient(135deg, #060E2B 0%, #0B1F3A 55%, #1B3FA6 100%)`

**Mesh gradient (ambient background):**
Two radial gradients over `#0A1F4C`:
- `radial-gradient(60% 60% at 20% 20%, rgba(46,107,255,0.35), rgba(10,31,76,0) 60%)`
- `radial-gradient(50% 50% at 80% 80%, rgba(111,168,255,0.22), rgba(10,31,76,0) 70%)`

### Typography

- **Primary:** `Inter` — weights 400 / 500 / 600 / 700 / 800
- **Display accent:** `Instrument Serif` — italic variant used sparingly
- **Mono:** `JetBrains Mono` — weights 400 / 500

**Scale:**
| Token | Size | Weight | Tracking |
|---|---|---|---|
| Hero display | 88px | 600 | −0.03em |
| H1 | 72px | 700 | −0.03em |
| H2 | 48px | 600 | −0.02em |
| H3 | 28px | 600 | −0.02em |
| Body lg | 18px | 400–500 | −0.01em |
| Body | 15–16px | 400 | 0 |
| Caption | 12px | 500 | 0 |
| Label (all-caps) | 11px | 600 | 0.14em |

### Spacing / radii
- Card radius: `14–18px`
- App icon radius: `26%` (iOS squircle)
- Chip / pill radius: `999px`
- Section padding: `60–80px` vertical, `48px` horizontal (desktop)

### Shadows
- Phone / coin drop: `0 30px 60px -18px rgba(0,0,0,0.55)`
- App icon: `0 18px 40px -12px rgba(0,0,0,0.6)`
- Card hover: `0 40px 80px -20px rgba(0,0,0,0.5)`

---

## The logo

The mark is a **lightning bolt that doubles as a stylized "S"**, set inside a navy disc. It has three rendering modes:

1. **3D coin hero** — perspective ellipse stack with milled (ridged) edge, gradient face, glowing bolt. See `brand/coin.jsx` → `Coin3D`. Use at hero size only (≥ 240px).
2. **Flat navy-filled** — simple navy disc with gradient bolt. Primary usage at 16–200px. See `FlatMark({ variant: 'navy-filled' })`.
3. **Flat variants** — `navy-outline`, `bolt-only`, `white-filled` for app icons and reverse contexts.

**The bolt path** (shared SVG `d` attribute in a 200×200 viewBox):
```
M 122 38 L 74 108 Q 70 114, 78 114 L 104 114 L 76 164 Q 72 170, 80 166
L 132 98 Q 136 92, 128 92 L 102 92 Z
```

When recreating: **keep the bolt geometry identical across all marks** — only the container (coin vs. outline vs. naked bolt) changes. The bolt is rendered with a linear gradient from light sky blue to navy blue for depth.

---

## Screens / Views

### 1. Marketing landing page (`Stewarding Change Hero.html`)

Primary artifact. Dark navy single-page site with the following sections (top → bottom):

**Nav bar** — logo left, nav links center, "Get the app" CTA right. Transparent background, white text, subtle blur on scroll.

**Hero**
- Split layout: left column = headline + subhead + CTAs + trust indicators; right column = iPhone mockup floating on gradient mesh.
- Headline: two lines, 72–88px, "Stewarding" in white / "Change" in accent blue.
- Primary CTA: pill, white background, navy text. Secondary CTA: text link with arrow.
- Trust strip: partner logos or metric counters (downloads, dollars given, etc.).

**Feature sections** — alternating text + visual blocks explaining:
- How round-ups work
- Mission funds
- Community transparency
- Security / trust

**Product mockups** — phone screens for key flows (dashboard, round-up detail, mission selection).

**Footer** — logo, nav links, legal copy, social.

All sections share the dark navy aesthetic with subtle radial gradients and translucent cards.

### 2. Brand sheet (`Brand Sheet.html`)

Reference artifact; recreate only if building an internal brand guidelines page.

Layout: 3-column unified grid with phone mockup spanning the full right column.
- **Row 1, Col 1:** Logo Variations (3 marks)
- **Row 1, Col 2:** App Icon (navy + white)
- **Row 2, Col 1:** Brand Meaning (large flat mark + 3 annotated meanings + tagline)
- **Row 2, Col 2:** Color Palette (5 swatches stacked above) + Typography card ("Aa Inter")
- **Col 3, spans both rows:** Phone mockup
- **Below grid:** Brand Applications — business card, letterhead, polo, water bottle.

### 3. Product app mockup (seen in Brand Sheet phone & hero)

**Stewarding Change app — round-ups dashboard:**
- Status bar (9:41, signal, wifi, battery)
- App header: logo + "Stewarding Change" + bell icon
- Hero balance card (gradient navy): "Active" indicator, "Grace Community" label, large balance `$1.72`, monthly delta, progress bar toward a mission fund (`Roof Restoration Fund · $21.46 / $33.42`)
- Round-ups section header with "See all"
- Three transaction rows with icon, name, date/amount, round-up amount, "rounded" caption
- Bottom tab bar: Home (active), Mission, Activity, Account

---

## Interactions & behavior (hero page)

- **Smooth scrolling** between sections
- **Nav bar:** transparent at top, blurs + darkens on scroll past 100px
- **CTA buttons:** subtle scale (1.02) + brightness on hover, `transition: all 200ms ease`
- **Cards:** translate-y(-2px) + shadow lift on hover
- **Phone mockup:** subtle float animation (±6px y, 6s ease-in-out infinite) — keep restrained
- **Gradient mesh background:** stationary (do not animate — causes repaint on scroll)
- **Fonts:** wait for `document.fonts.ready` before rendering to avoid Times fallback

---

## State management

The prototype is static. For the real app:

**Marketing page** — no state beyond scroll position + nav blur.
**App (round-ups dashboard)** — needs:
- Current balance
- Monthly delta
- Active mission fund (name, progress, target)
- Transaction list (source, amount, rounded amount, timestamp)
- Active tab

---

## Assets

- `assets/sc-logo.png` — raster logo for platforms where SVG is inconvenient
- All other marks are **SVG-native** in the `.jsx` files — port them directly into your component library.
- Fonts: load Inter, Instrument Serif, and JetBrains Mono via Google Fonts or self-hosted woff2.

---

## Gotchas

- **Bolt geometry is fixed** — don't redraw it. Copy the exact path `d` from `brand/coin.jsx` / `logo/marks.jsx`.
- **The "Aa" typography specimen** must explicitly set `font-family: Inter` or it falls back to serif.
- **The 3D coin is expensive to render** — use it only at hero size. Below 120px, switch to `FlatMark`.
- **Never animate the gradient mesh background** — it causes heavy GPU repaints during scroll.
- **App icon gradient** (navy): `linear-gradient(135deg, #1E3A8A, #0B1F3A)`. White variant: `linear-gradient(135deg, #FFFFFF, #E6F0FF)`.

---

## Questions for the implementing dev

1. Target framework? (React / Next.js recommended for the marketing site; SwiftUI / React Native for the app.)
2. Component library? (Tailwind + shadcn/ui pairs well with these tokens.)
3. Is the round-ups dashboard meant to ship as a real product, or is it a demo mockup for the landing page?
