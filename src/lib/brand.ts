export const BRAND = {
  name: "VOLT",
  tagline: "Two colors. Maximum tension.",
} as const

export interface BrandColor {
  name: string
  hex: string
  oklch: string
  rgb: string
  role: string
  /** Tailwind text color class that reads legibly on this swatch. */
  ink: string
}

export const BRAND_COLORS: readonly BrandColor[] = [
  {
    name: "Orange Red",
    hex: "#FF4103",
    oklch: "oklch(0.632 0.2229 32.36)",
    rgb: "rgb(255, 65, 3)",
    role: "Accent / energy — CTAs, highlights, kinetic moments",
    ink: "text-[#001621]",
  },
  {
    name: "Abyss Navy",
    hex: "#001621",
    oklch: "oklch(0.1957 0.0281 232.38)",
    rgb: "rgb(0, 22, 33)",
    role: "Deep base — backgrounds, surfaces, body ink",
    ink: "text-white",
  },
] as const
