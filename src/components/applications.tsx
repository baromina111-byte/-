import { BoltGlyph, VoltMark } from "@/components/icons"

function JerseyCard() {
  return (
    <div
      className="relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-3xl p-7"
      style={{ backgroundColor: "#001621" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 top-1/2 h-[140%] w-24 -translate-y-1/2 rotate-12"
        style={{ backgroundColor: "#FF4103" }}
      />
      <div className="relative flex items-center justify-between text-white">
        <VoltMark className="size-8" />
        <span className="font-mono text-xs uppercase tracking-widest text-white/60">
          Home kit
        </span>
      </div>
      <div className="relative">
        <p className="font-heading text-[8rem] font-black leading-[0.8] text-white sm:text-[9rem]">
          09
        </p>
        <p
          className="font-heading text-2xl font-black uppercase tracking-tight"
          style={{ color: "#FF4103" }}
        >
          Vasquez
        </p>
      </div>
    </div>
  )
}

function PosterCard() {
  return (
    <div
      className="relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-3xl p-7"
      style={{ backgroundColor: "#FF4103" }}
    >
      <div className="flex items-center justify-between text-[#001621]">
        <span className="font-mono text-xs font-bold uppercase tracking-widest">
          Live · 08.14
        </span>
        <BoltGlyph className="size-5" />
      </div>
      <div>
        <p className="font-heading text-6xl font-black uppercase leading-[0.82] tracking-[-0.03em] text-[#001621] sm:text-7xl">
          After
          <br />
          Dark
        </p>
        <p className="mt-3 max-w-[16rem] font-medium text-[#001621]/80">
          A night of bass, light and heat. Warehouse 21, doors at 10pm.
        </p>
      </div>
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest text-[#FF4103]"
        style={{ backgroundColor: "#001621" }}
      >
        Tickets
        <span>→</span>
      </div>
    </div>
  )
}

function TicketBanner() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card">
      <div
        className="flex items-center justify-between px-7 py-5"
        style={{ backgroundColor: "#FF4103" }}
      >
        <VoltMark className="size-8" />
        <span className="font-heading text-lg font-black uppercase tracking-tight text-[#001621]">
          Season Pass
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-6 p-7">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Admit one · Row A
          </p>
          <p className="mt-3 font-heading text-4xl font-black uppercase leading-none tracking-tight">
            Center
            <br />
            Circuit
          </p>
        </div>
        <div className="flex items-end justify-between border-t border-dashed border-border pt-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Seat
            </p>
            <p className="font-heading text-2xl font-black">A-09</p>
          </div>
          <div className="rounded-lg bg-primary px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary-foreground">
            Scan in
          </div>
        </div>
      </div>
    </div>
  )
}

export function Applications() {
  return (
    <section id="applications" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <header className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            04 — Applications
          </p>
          <h2 className="mt-4 font-heading text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-6xl">
            Built for the
            <br />
            loudest rooms
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Sports kits, concert posters, urban outdoor. The two-color system
            snaps onto anything and reads from across the street.
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <JerseyCard />
          <PosterCard />
          <TicketBanner />
        </div>
      </div>
    </section>
  )
}
