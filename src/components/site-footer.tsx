import { BRAND } from "@/lib/brand"
import { VoltWordmark } from "@/components/icons"

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <VoltWordmark />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {BRAND.tagline}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <span>#FF4103</span>
            <span>#001621</span>
            <span>Orange Red / Abyss Navy</span>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND.name}. A two-color brand system.</p>
          <p className="font-mono uppercase tracking-widest">
            Bold · Kinetic · High-contrast
          </p>
        </div>
      </div>
    </footer>
  )
}
