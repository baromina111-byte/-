import Link from "next/link"

import { Button } from "@/components/ui/button"
import { BoltGlyph } from "@/components/icons"

const MARQUEE_WORDS = [
  "SPORTS",
  "MUSIC",
  "STREET",
  "OUTDOOR",
  "POSTERS",
  "KINETIC",
]

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-border"
    >
      {/* Kinetic backdrop — orange energy bleeding up from the abyss */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_80%_-10%,color-mix(in_oklab,var(--primary)_38%,transparent),transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="animate-volt-pulse pointer-events-none absolute -right-24 top-1/4 size-[28rem] rounded-full bg-primary/25 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 sm:px-8 sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <BoltGlyph className="size-3.5" />
          Two-color brand system
        </span>

        <h1 className="mt-7 max-w-4xl font-heading text-6xl font-black uppercase leading-[0.85] tracking-[-0.045em] sm:text-8xl lg:text-[9.5rem]">
          Heat meets
          <br />
          the{" "}
          <span className="animate-volt-sweep bg-[linear-gradient(100deg,var(--primary)_20%,color-mix(in_oklab,var(--primary)_55%,white)_50%,var(--primary)_80%)] bg-clip-text text-transparent">
            abyss
          </span>
        </h1>

        <p className="mt-7 max-w-xl text-lg text-muted-foreground sm:text-xl">
          VOLT is a brand system built on exactly two colors — Orange Red and
          Abyss Navy. Opposite ends of the temperature spectrum. Where they
          collide, they create the fastest attention-grab in the room.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="#colors" />}
            className="h-12 px-6 text-base font-bold uppercase tracking-wide"
          >
            Explore the system
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="#applications" />}
            className="h-12 px-6 text-base font-semibold uppercase tracking-wide"
          >
            See it live
          </Button>
        </div>
      </div>

      {/* Kinetic marquee strip */}
      <div className="relative flex overflow-hidden border-t border-border bg-primary py-3 text-primary-foreground select-none">
        <div className="animate-marquee flex shrink-0 items-center gap-6 whitespace-nowrap pr-6">
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="flex items-center gap-6 text-sm font-black uppercase tracking-[0.25em]"
            >
              {word}
              <BoltGlyph className="size-4" />
            </span>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="animate-marquee flex shrink-0 items-center gap-6 whitespace-nowrap pr-6"
        >
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
            <span
              key={`dup-${word}-${i}`}
              className="flex items-center gap-6 text-sm font-black uppercase tracking-[0.25em]"
            >
              {word}
              <BoltGlyph className="size-4" />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
