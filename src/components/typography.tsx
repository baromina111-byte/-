interface TypeRow {
  label: string
  spec: string
  sample: string
  className: string
}

const TYPE_SCALE: readonly TypeRow[] = [
  {
    label: "Display",
    spec: "Geist · 900 · clamp 3.5–9.5rem · -0.045em",
    sample: "VOLT",
    className:
      "font-heading text-5xl sm:text-7xl font-black uppercase tracking-[-0.045em] leading-[0.85]",
  },
  {
    label: "Heading 1",
    spec: "Geist · 800 · 3rem · -0.03em",
    sample: "Heat meets the abyss",
    className:
      "font-heading text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[0.95]",
  },
  {
    label: "Heading 2",
    spec: "Geist · 800 · 2.25rem",
    sample: "The fastest attention-grab",
    className: "font-heading text-3xl sm:text-4xl font-extrabold tracking-tight",
  },
  {
    label: "Heading 3",
    spec: "Geist · 700 · 1.5rem",
    sample: "Built for stadiums and stages",
    className: "font-heading text-2xl font-bold tracking-tight",
  },
  {
    label: "Heading 4",
    spec: "Geist · 600 · 1.25rem",
    sample: "Kinetic, bold, high-contrast",
    className: "font-heading text-xl font-semibold",
  },
  {
    label: "Body",
    spec: "Geist · 400 · 1.125rem · 1.6",
    sample:
      "Orange Red and Abyss Navy sit at opposite ends of the temperature spectrum. Where they meet, they create instant tension.",
    className: "text-lg leading-relaxed text-muted-foreground",
  },
  {
    label: "Caption",
    spec: "Geist Mono · 500 · 0.8rem · 0.1em",
    sample: "FF4103 / 001621 — POSTER · JERSEY · BILLBOARD",
    className:
      "font-mono text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground",
  },
]

export function Typography() {
  return (
    <section id="type" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <header className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            02 — Typography
          </p>
          <h2 className="mt-4 font-heading text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-6xl">
            One typeface,
            <br />
            set loud
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Geist carries the whole system. Headlines run heavy and tight in
            uppercase; body stays clean and quiet so the color does the shouting.
          </p>
        </header>

        <div className="mt-12 divide-y divide-border rounded-3xl border border-border">
          {TYPE_SCALE.map((row) => (
            <div
              key={row.label}
              className="grid gap-3 p-6 sm:grid-cols-[10rem_1fr] sm:gap-8 sm:p-8"
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-wide">
                  {row.label}
                </span>
                <span className="mt-1 font-mono text-xs text-muted-foreground">
                  {row.spec}
                </span>
              </div>
              <p className={row.className}>{row.sample}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
