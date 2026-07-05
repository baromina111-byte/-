import type { HTMLAttributes, SVGProps } from "react"

import { cn } from "@/lib/utils"

/**
 * VoltMark — the geometric VOLT logo mark.
 *
 * A rounded Abyss Navy tile split by a tension seam, carrying an Orange Red
 * lightning bolt. Uses only the two brand colors (plus transparent).
 * The two temperatures collide on the diagonal seam — the core brand idea.
 */
export function VoltMark({
  className,
  title = "VOLT",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={cn("size-8", className)}
      {...props}
    >
      <defs>
        <clipPath id="volt-tile">
          <rect x="0" y="0" width="48" height="48" rx="11" />
        </clipPath>
      </defs>
      <g clipPath="url(#volt-tile)">
        {/* Deep base */}
        <rect width="48" height="48" fill="#001621" />
        {/* Orange energy wedge meeting the navy on the diagonal seam */}
        <path d="M48 0 L48 48 L14 48 Z" fill="#FF4103" />
        {/* Lightning bolt straddling the seam */}
        <path
          d="M27 7 L13 26 L22 26 L20 41 L35 20 L25 20 Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  )
}

/**
 * VoltWordmark — the mark locked up with the VOLT wordmark.
 * `tone` controls the wordmark ink so it can sit on navy, orange, or white.
 */
export function VoltWordmark({
  className,
  tone = "light",
  showMark = true,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "light" | "dark"
  showMark?: boolean
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      {...props}
    >
      {showMark ? <VoltMark className="size-7" /> : null}
      <span
        className={cn(
          "font-heading text-xl font-black tracking-[-0.04em] uppercase leading-none",
          tone === "light" ? "text-foreground" : "text-[#001621]"
        )}
      >
        Volt
      </span>
    </span>
  )
}

/** BoltGlyph — bare lightning bolt, single-color via currentColor. */
export function BoltGlyph({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-5", className)}
      {...props}
    >
      <path d="M13.5 2 4 14h6l-1.5 8L20 9h-6z" />
    </svg>
  )
}
