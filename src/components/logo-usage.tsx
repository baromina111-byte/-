import { VoltMark, VoltWordmark } from "@/components/icons"
import { cn } from "@/lib/utils"

interface LogoTile {
  label: string
  bgClass: string
  bgStyle?: React.CSSProperties
  tone: "light" | "dark"
  ring?: boolean
}

const LOGO_TILES: readonly LogoTile[] = [
  {
    label: "On Abyss Navy",
    bgClass: "",
    bgStyle: { backgroundColor: "#001621" },
    tone: "light",
  },
  {
    label: "On Orange Red",
    bgClass: "",
    bgStyle: { backgroundColor: "#FF4103" },
    tone: "dark",
  },
  {
    label: "On White",
    bgClass: "bg-white",
    tone: "dark",
    ring: true,
  },
]

const RULES = [
  {
    title: "Clear space",
    body: "Keep clear space equal to the height of the bolt mark on all sides. Never crowd the lockup with type or graphics.",
  },
  {
    title: "Minimum size",
    body: "Never render the mark below 24px, or the wordmark below 88px wide. Below that, the seam and bolt lose their punch.",
  },
  {
    title: "Two colors only",
    body: "The mark is Orange Red, Abyss Navy and white. Never recolor it, add gradients beyond the system, or drop shadows on it.",
  },
]

export function LogoUsage() {
  return (
    <section id="logo" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <header className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            03 — Logo
          </p>
          <h2 className="mt-4 font-heading text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-6xl">
            One mark,
            <br />
            every surface
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            The bolt straddles the seam where heat meets the deep. It holds up on
            navy, on orange, and on white.
          </p>
        </header>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {LOGO_TILES.map((tile) => (
            <div
              key={tile.label}
              className={cn(
                "flex aspect-[4/3] flex-col items-center justify-center gap-5 rounded-3xl",
                tile.bgClass,
                tile.ring && "ring-1 ring-inset ring-border"
              )}
              style={tile.bgStyle}
            >
              <VoltMark className="size-16" />
              <VoltWordmark showMark={false} tone={tile.tone} />
              <span
                className={cn(
                  "font-mono text-xs uppercase tracking-widest",
                  tile.tone === "light" ? "text-white/60" : "text-[#001621]/60"
                )}
              >
                {tile.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {RULES.map((rule) => (
            <div
              key={rule.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="font-heading text-lg font-bold uppercase tracking-tight">
                {rule.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{rule.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
