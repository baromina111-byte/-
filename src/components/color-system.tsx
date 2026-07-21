import { BRAND_COLORS } from "@/lib/brand"
import { cn } from "@/lib/utils"

function SwatchRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-current/15 py-2 text-sm">
      <span className="font-medium uppercase tracking-wide opacity-70">
        {label}
      </span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  )
}

export function ColorSystem() {
  return (
    <section id="colors" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <header className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            01 — Color system
          </p>
          <h2 className="mt-4 font-heading text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-6xl">
            The whole brand,
            <br />
            two colors deep
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Every surface, tint and shade is derived from these two hues. No
            third color, no gray — just heat against the deep.
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {BRAND_COLORS.map((color) => (
            <article
              key={color.hex}
              className={cn(
                "flex min-h-[22rem] flex-col justify-between rounded-3xl p-8 sm:p-10",
                color.ink
              )}
              style={{ backgroundColor: color.hex }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-3xl font-black uppercase tracking-tight sm:text-4xl">
                    {color.name}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm opacity-75">
                    {color.role}
                  </p>
                </div>
                <span className="font-mono text-lg font-bold">
                  {color.hex}
                </span>
              </div>

              <div className="mt-8">
                <SwatchRow label="HEX" value={color.hex} />
                <SwatchRow label="RGB" value={color.rgb} />
                <SwatchRow label="OKLCH" value={color.oklch} />
              </div>
            </article>
          ))}
        </div>

        {/* Usage ratio — the 90 / 10 rule */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-border">
          <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="max-w-md">
              <h3 className="font-heading text-2xl font-black uppercase tracking-tight">
                The 90 / 10 rule
              </h3>
              <p className="mt-2 text-muted-foreground">
                Let Abyss Navy hold roughly 90% of the canvas. Orange Red earns
                the remaining 10% — used sparingly, it hits like a spark.
              </p>
            </div>
            <div className="flex h-16 w-full max-w-sm overflow-hidden rounded-xl">
              <div
                className="flex items-center justify-center text-xs font-bold uppercase tracking-widest text-white"
                style={{ backgroundColor: "#001621", width: "90%" }}
              >
                90% Navy
              </div>
              <div
                className="flex items-center justify-center text-xs font-bold uppercase tracking-widest text-[#001621]"
                style={{ backgroundColor: "#FF4103", width: "10%" }}
              >
                10
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
