# VOLT — Design Tokens

**Brand:** VOLT
**Tagline:** Two colors. Maximum tension.
**Personality:** Bold · Kinetic · High-contrast
**Intended use:** Sports branding, music / concert posters, urban outdoor advertising.

VOLT is built on **exactly two colors**. Orange Red and Abyss Navy sit at
opposite ends of the temperature spectrum; where they meet they create instant
tension — the fastest attention-grab in the room. Every other value in the
system (tints, shades, borders, muted surfaces) is **derived** from these two
hues. There are no third colors and no chroma-0 grays.

---

## 1. The two brand colors

| Color | HEX | RGB | OKLCH | Hue | Role |
| --- | --- | --- | --- | --- | --- |
| **Orange Red** | `#FF4103` | `rgb(255, 65, 3)` | `oklch(0.632 0.2229 32.36)` | 32.36 | Accent / energy — CTAs, highlights, kinetic moments |
| **Abyss Navy** | `#001621` | `rgb(0, 22, 33)` | `oklch(0.1957 0.0281 232.38)` | 232.38 | Deep base — backgrounds, surfaces, body ink |

All derived values reuse one of these two hues:

- **Neutrals** (background, card, muted, border, foreground) → **navy hue 232.38**
  at very low chroma (0.006 – 0.036).
- **Accents** (accent, accent-foreground, chart-2) → **orange hue 32.36 – 42**.

---

## 2. Derived tint / shade scales

### Navy neutral scale (hue 232.38)

| Step | OKLCH | Usage (dark) | Usage (light) |
| --- | --- | --- | --- |
| N-05 | `oklch(0.1957 0.0281 232.38)` | background | foreground / ink |
| N-10 | `oklch(0.22 0.03 232.38)` | sidebar | — |
| N-15 | `oklch(0.24 0.032 232.38)` | card / popover | — |
| N-25 | `oklch(0.29 0.036 232.38)` | secondary / muted | — |
| N-55 | `oklch(0.55 0.05 232.38)` | chart-3 | — |
| N-72 | `oklch(0.72 0.024 232.38)` | muted-foreground | — |
| N-90 | `oklch(0.9 0.012 232.38)` | — | border / input |
| N-95 | `oklch(0.95 0.008 232.38)` | — | muted / secondary |
| N-97 | `oklch(0.97 0.006 232.38)` | foreground (near-white) | — |
| N-99 | `oklch(0.994 0.002 232.38)` | — | background (near-white) |

### Orange accent scale (hue 32.36 – 42)

| Step | OKLCH | Usage |
| --- | --- | --- |
| O-32 (dark accent) | `oklch(0.32 0.05 32.36)` | accent surface (dark) |
| O-45 (light accent-fg) | `oklch(0.45 0.16 32.36)` | accent-foreground (light) |
| **O-BASE** | `oklch(0.632 0.2229 32.36)` | **primary / ring / chart-1 = `#FF4103`** |
| O-74 | `oklch(0.74 0.16 42)` | chart-2 (dark) |
| O-85 | `oklch(0.85 0.13 40)` | accent-foreground (dark) |
| O-95 | `oklch(0.95 0.055 40)` | accent surface (light) |

---

## 3. Token mapping table

Every shadcn/ui custom property name is preserved; only values changed. Tokens
live in `src/app/globals.css`.

| Token | Light | Dark (default brand theme) |
| --- | --- | --- |
| `--background` | `oklch(0.994 0.002 232.38)` | `oklch(0.1957 0.0281 232.38)` (Abyss Navy) |
| `--foreground` | `oklch(0.1957 0.0281 232.38)` (Abyss Navy) | `oklch(0.97 0.006 232.38)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.24 0.032 232.38)` |
| `--card-foreground` | navy | `oklch(0.97 0.006 232.38)` |
| `--popover` / `--popover-foreground` | white / navy | `oklch(0.24 0.032 232.38)` / near-white |
| `--primary` | `oklch(0.632 0.2229 32.36)` (Orange Red) | `oklch(0.632 0.2229 32.36)` (Orange Red) |
| `--primary-foreground` | Abyss Navy | Abyss Navy |
| `--secondary` | `oklch(0.95 0.009 232.38)` | `oklch(0.29 0.036 232.38)` |
| `--secondary-foreground` | navy | near-white |
| `--muted` | `oklch(0.955 0.008 232.38)` | `oklch(0.29 0.034 232.38)` |
| `--muted-foreground` | `oklch(0.46 0.026 232.38)` | `oklch(0.72 0.024 232.38)` |
| `--accent` | `oklch(0.95 0.055 40)` (orange tint) | `oklch(0.32 0.05 32.36)` (orange tint) |
| `--accent-foreground` | `oklch(0.45 0.16 32.36)` | `oklch(0.85 0.13 40)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| `--border` | `oklch(0.9 0.012 232.38)` | `oklch(0.7 0.03 232.38 / 18%)` |
| `--input` | `oklch(0.9 0.012 232.38)` | `oklch(0.7 0.03 232.38 / 24%)` |
| `--ring` | Orange Red | Orange Red |
| `--chart-1` | Orange Red | Orange Red |
| `--chart-2` | `oklch(0.72 0.17 40)` | `oklch(0.74 0.16 42)` |
| `--chart-3` | `oklch(0.5 0.05 232.38)` | `oklch(0.55 0.05 232.38)` |
| `--chart-4` | `oklch(0.66 0.04 232.38)` | `oklch(0.68 0.04 232.38)` |
| `--chart-5` | `oklch(0.8 0.028 232.38)` | `oklch(0.82 0.03 232.38)` |
| `--sidebar` | `oklch(0.99 0.003 232.38)` | `oklch(0.22 0.03 232.38)` |
| `--sidebar-primary` | Orange Red | Orange Red |
| `--sidebar-accent` | orange tint | orange tint |
| `--radius` | `0.625rem` | (inherited) |

> The app ships in the **dark** brand theme by default (`<html class="dark">` in
> `src/app/layout.tsx`). Light mode is fully themed as a companion.

---

## 4. Typography scale

Single typeface: **Geist** (sans) with **Geist Mono** for captions / data.
Configured via `next/font/google` in `src/app/layout.tsx`, exposed as
`--font-sans` / `--font-mono`; `--font-heading` maps to the sans family.

| Role | Family | Weight | Size | Tracking | Notes |
| --- | --- | --- | --- | --- | --- |
| Display | Geist | 900 | 3.5 – 9.5rem | -0.045em | Uppercase, leading 0.85 |
| H1 | Geist | 800 | 3rem | -0.03em | Uppercase headlines |
| H2 | Geist | 800 | 2.25rem | tight | |
| H3 | Geist | 700 | 1.5rem | tight | |
| H4 | Geist | 600 | 1.25rem | normal | |
| Body | Geist | 400 | 1.125rem | normal | line-height 1.6, muted-foreground |
| Caption | Geist Mono | 500 | 0.8rem | 0.1em | Uppercase, data / labels |

**Rule:** headlines run heavy, tight and uppercase; body stays clean and quiet
so color carries the emphasis.

---

## 5. Usage rules

### Base-to-accent ratio — the 90 / 10 rule
Abyss Navy holds ~90% of any composition; Orange Red earns ~10%. Used sparingly,
orange reads as a spark. Flooding a layout with orange kills the tension.

### Contrast pairings (safe)
| Foreground | Background | Use |
| --- | --- | --- |
| Near-white `oklch(0.97 …)` | Abyss Navy `#001621` | Body text on the base |
| Abyss Navy `#001621` | Orange Red `#FF4103` | Text / icons on accent (high contrast) |
| Orange Red `#FF4103` | Abyss Navy `#001621` | Accent text / CTAs on the base |
| Abyss Navy `#001621` | White | Light-mode ink |

> Avoid white text on Orange Red for small body copy — its contrast is marginal.
> Pair Orange Red with **Abyss Navy** ink instead (this is why
> `--primary-foreground` is navy).

### Do
- Keep the palette to the two colors plus white / transparent.
- Let navy dominate; spend orange like currency.
- Set headlines big, heavy, uppercase and tight.
- Derive any new neutral from the navy hue (232.38) at low chroma.

### Don't
- Don't introduce a third brand color or a chroma-0 gray.
- Don't recolor or gradient the logo mark outside the system.
- Don't put small orange text on navy at tiny sizes, or small white text on orange.
- Don't let orange coverage creep past ~10–15% of a layout.
